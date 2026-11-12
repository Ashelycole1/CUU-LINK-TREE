import { NotFoundError } from "../shared/errors";
import { slugify } from "../shared/guards";
import type { Clock, IdGenerator } from "../shared/ports";
import type {
  AddImageInput,
  CreateEventInput,
  EventDTO,
  EventListQuery,
  UpdateEventInput,
} from "../dto";
import type { ReviewRepository } from "../reviews/ReviewRepository";
import { RatingSummary } from "../reviews/RatingSummary";
import { Event } from "./Event";
import type { EventRepository } from "./EventRepository";
import { ImageLink } from "./ImageLink";

/**
 * Application service for events: the use cases the API and apps call.
 * It orchestrates entities and repositories but holds no rules of its own;
 * those live on Event, ImageLink and EventLink.
 */
export class EventService {
  constructor(
    private readonly events: EventRepository,
    private readonly reviews: ReviewRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async list(query: EventListQuery = {}): Promise<EventDTO[]> {
    const now = this.clock.now();
    const when = query.when ?? "all";
    const category = query.category?.trim().toLowerCase();

    let found = (await this.events.findAll()).filter((event) => {
      const status = event.status(now);
      if (when === "upcoming" && status === "past") return false;
      if (when === "past" && status !== "past") return false;
      if (category && event.category.toLowerCase() !== category) return false;
      return event.matches(query.q ?? "");
    });

    // Upcoming reads soonest-first; the archive reads most-recent-first.
    found.sort((a, b) =>
      when === "past"
        ? b.startsAt.getTime() - a.startsAt.getTime()
        : a.startsAt.getTime() - b.startsAt.getTime() || a.position - b.position,
    );
    if (query.limit && query.limit > 0) found = found.slice(0, query.limit);

    return Promise.all(found.map((event) => this.present(event, now)));
  }

  async categories(): Promise<string[]> {
    const all = await this.events.findAll();
    return [...new Set(all.map((e) => e.category))].sort((a, b) => a.localeCompare(b));
  }

  /** Accepts either the id or the slug, so share links can use readable slugs. */
  async get(idOrSlug: string): Promise<EventDTO> {
    return this.present(await this.require(idOrSlug), this.clock.now());
  }

  async create(input: CreateEventInput): Promise<EventDTO> {
    const now = this.clock.now();
    const existing = await this.events.findAll();
    const event = Event.create(input, {
      id: this.ids.next(),
      slug: await this.uniqueSlug(input.title),
      now,
      position: existing.length,
    });
    await this.events.save(event);
    return this.present(event, now);
  }

  async update(idOrSlug: string, patch: UpdateEventInput): Promise<EventDTO> {
    const now = this.clock.now();
    const event = await this.require(idOrSlug);
    event.update(patch, now);
    await this.events.save(event);
    return this.present(event, now);
  }

  async addImage(idOrSlug: string, input: AddImageInput): Promise<EventDTO> {
    const now = this.clock.now();
    const event = await this.require(idOrSlug);
    event.addImage(ImageLink.create(input), now);
    await this.events.save(event);
    return this.present(event, now);
  }

  async remove(idOrSlug: string): Promise<void> {
    const event = await this.require(idOrSlug);
    await this.reviews.deleteByEvent(event.id);
    await this.events.delete(event.id);
  }

  private async require(idOrSlug: string): Promise<Event> {
    const event = (await this.events.findById(idOrSlug)) ?? (await this.events.findBySlug(idOrSlug));
    if (!event) throw new NotFoundError("Event", idOrSlug);
    return event;
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    for (let n = 2; await this.events.findBySlug(candidate); n += 1) candidate = `${base}-${n}`;
    return candidate;
  }

  private async present(event: Event, now: Date): Promise<EventDTO> {
    const reviews = await this.reviews.findByEvent(event.id);
    return {
      ...event.toRecord(),
      status: event.status(now),
      acceptsReviews: event.acceptsReviews(now),
      rating: RatingSummary.of(reviews).toDTO(),
    };
  }
}
