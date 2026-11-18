import { ForbiddenError, NotFoundError, ValidationError } from "../shared/errors";
import { slugify } from "../shared/guards";
import type { Clock, IdGenerator } from "../shared/ports";
import type {
  AddImageInput,
  CommunityDTO,
  CommunityQuery,
  CreateEventInput,
  EventDTO,
  EventListQuery,
  TreeDTO,
  UpdateEventInput,
} from "../dto";
import type { ProfileRepository } from "../profile/Profile";
import type { ReviewRepository } from "../reviews/ReviewRepository";
import { RatingSummary } from "../reviews/RatingSummary";
import { EVENT_CATEGORIES } from "./categories";
import { Event } from "./Event";
import type { EventRepository } from "./EventRepository";
import { ImageLink } from "./ImageLink";

/**
 * Application service for events. Two audiences:
 *  - public visitors, who see a host's visible events by username;
 *  - the host, who manages their own events from the dashboard.
 * Ownership is checked here; field rules live on Event and its value objects.
 */
export class EventService {
  constructor(
    private readonly events: EventRepository,
    private readonly reviews: ReviewRepository,
    private readonly profiles: ProfileRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  /* ---------- public ---------- */

  /** Everything a public page needs: profile, upcoming and past (visible only), and categories. */
  async tree(username: string): Promise<TreeDTO> {
    const profile = await this.profiles.findByUsername(username.toLowerCase());
    if (!profile) throw new NotFoundError("Page", username);
    const visible = (await this.events.findByOwner(profile.ownerId)).filter((e) => !e.hidden);
    const now = this.clock.now();
    return {
      profile: profile.toDTO(),
      upcoming: await this.present(this.filter(visible, { when: "upcoming" }, now), now),
      past: await this.present(this.filter(visible, { when: "past" }, now), now),
      categories: [...new Set(visible.map((e) => e.category))].sort((a, b) => a.localeCompare(b)),
    };
  }

  /**
   * Upcoming and live events from every host, soonest first, for the
   * Community page. Hidden events and hosts without a page are left out.
   * Category counts ignore the category filter so every chip shows its total.
   */
  async community(query: CommunityQuery = {}): Promise<CommunityDTO> {
    const now = this.clock.now();
    const all = (await this.events.findEndingAfter(now)).filter((e) => !e.hidden);
    const hosts = new Map<string, Awaited<ReturnType<ProfileRepository["findByOwner"]>>>();
    for (const ownerId of new Set(all.map((e) => e.ownerId))) hosts.set(ownerId, await this.profiles.findByOwner(ownerId));
    const listed = all.filter((e) => hosts.get(e.ownerId));

    const counts = new Map<string, number>();
    for (const e of listed) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    const categories = EVENT_CATEGORIES.filter((c) => counts.has(c)).map((name) => ({ name, count: counts.get(name)! }));

    const category = query.category?.trim().toLowerCase();
    const limit = Math.min(Math.max(query.limit ?? 60, 1), 100);
    const found = listed
      .filter((e) => (!category || e.category.toLowerCase() === category) && e.matches(query.q ?? ""))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, limit);

    const events = await Promise.all(
      found.map(async (e) => {
        const p = hosts.get(e.ownerId)!.toDTO();
        return {
          event: await this.presentOne(e, now),
          host: { username: p.username, displayName: p.displayName, avatarUrl: p.avatarUrl || p.heroImageUrl, color: p.appearance.colors.background },
        };
      }),
    );
    return { events, categories };
  }

  async listPublic(username: string, query: EventListQuery = {}): Promise<EventDTO[]> {
    const ownerId = await this.ownerIdFor(username);
    const now = this.clock.now();
    const visible = (await this.events.findByOwner(ownerId)).filter((e) => !e.hidden);
    return this.present(this.filter(visible, query, now), now);
  }

  async getPublic(username: string, slug: string): Promise<EventDTO> {
    const event = await this.events.findBySlug(await this.ownerIdFor(username), slug);
    if (!event || event.hidden) throw new NotFoundError("Event", slug);
    return this.presentOne(event, this.clock.now());
  }

  /** Visitors can add photos to any visible event (by link). */
  async addImage(eventId: string, input: AddImageInput): Promise<EventDTO> {
    const now = this.clock.now();
    const event = await this.events.findById(eventId);
    if (!event || event.hidden) throw new NotFoundError("Event", eventId);
    event.addImage(ImageLink.create(input), now);
    await this.events.save(event);
    return this.presentOne(event, now);
  }

  /* ---------- host dashboard ---------- */

  /** All of a host's events, hidden ones included, in their manual order. */
  async listMine(ownerId: string): Promise<EventDTO[]> {
    const now = this.clock.now();
    const mine = (await this.events.findByOwner(ownerId)).sort((a, b) => a.position - b.position);
    return this.present(mine, now);
  }

  async create(ownerId: string, input: CreateEventInput): Promise<EventDTO> {
    const now = this.clock.now();
    const mine = await this.events.findByOwner(ownerId);
    // New events go to the top, like a new link in Linktree.
    for (const e of mine) {
      e.moveTo(e.position + 1, now);
      await this.events.save(e);
    }
    const event = Event.create(input, {
      id: this.ids.next(),
      ownerId,
      slug: await this.uniqueSlug(ownerId, input.title),
      now,
      position: 0,
    });
    await this.events.save(event);
    return this.presentOne(event, now);
  }

  async update(ownerId: string, eventId: string, patch: UpdateEventInput): Promise<EventDTO> {
    const now = this.clock.now();
    const event = await this.requireOwned(ownerId, eventId);
    event.update(patch, now);
    await this.events.save(event);
    return this.presentOne(event, now);
  }

  async remove(ownerId: string, eventId: string): Promise<void> {
    const event = await this.requireOwned(ownerId, eventId);
    await this.reviews.deleteByEvent(event.id);
    await this.events.delete(event.id);
  }

  /** Saves a new manual order. `orderedIds` must list every one of the host's events exactly once. */
  async reorder(ownerId: string, orderedIds: string[]): Promise<EventDTO[]> {
    const now = this.clock.now();
    const mine = await this.events.findByOwner(ownerId);
    const ids = new Set(mine.map((e) => e.id));
    if (orderedIds.length !== ids.size || new Set(orderedIds).size !== ids.size || !orderedIds.every((id) => ids.has(id))) {
      throw new ValidationError("The new order must list each of your events exactly once.", "ids");
    }
    for (const event of mine) {
      event.moveTo(orderedIds.indexOf(event.id), now);
      await this.events.save(event);
    }
    return this.listMine(ownerId);
  }

  /* ---------- helpers ---------- */

  private filter(events: Event[], query: EventListQuery, now: Date): Event[] {
    const when = query.when ?? "all";
    const category = query.category?.trim().toLowerCase();
    let found = events.filter((event) => {
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
    return found;
  }

  private async ownerIdFor(username: string): Promise<string> {
    const profile = await this.profiles.findByUsername(username.toLowerCase());
    if (!profile) throw new NotFoundError("Page", username);
    return profile.ownerId;
  }

  private async requireOwned(ownerId: string, eventId: string): Promise<Event> {
    const event = await this.events.findById(eventId);
    if (!event) throw new NotFoundError("Event", eventId);
    if (!event.isOwnedBy(ownerId)) throw new ForbiddenError();
    return event;
  }

  private async uniqueSlug(ownerId: string, title: string): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    for (let n = 2; await this.events.findBySlug(ownerId, candidate); n += 1) candidate = `${base}-${n}`;
    return candidate;
  }

  private present(events: Event[], now: Date): Promise<EventDTO[]> {
    return Promise.all(events.map((e) => this.presentOne(e, now)));
  }

  private async presentOne(event: Event, now: Date): Promise<EventDTO> {
    const reviews = await this.reviews.findByEvent(event.id);
    return {
      ...event.toRecord(),
      status: event.status(now),
      acceptsReviews: event.acceptsReviews(now),
      rating: RatingSummary.of(reviews).toDTO(),
    };
  }
}
