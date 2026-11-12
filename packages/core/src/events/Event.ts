import { Entity } from "../shared/Entity";
import { BusinessRuleError, ValidationError } from "../shared/errors";
import { Guard } from "../shared/guards";
import type { CreateEventInput, EventRecord, EventStatus, UpdateEventInput } from "../dto";
import { EventLink } from "./EventLink";
import { ImageLink } from "./ImageLink";

interface EventState {
  ownerId: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  organizer: string;
  venue: string;
  emoji: string;
  startsAt: Date;
  endsAt: Date;
  coverImage: ImageLink | null;
  gallery: ImageLink[];
  links: EventLink[];
  position: number;
  hidden: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The aggregate root of the app: one event on the tree.
 *
 * State is private and only changes through methods that re-check every
 * rule, so an Event instance is always valid. Whether it is upcoming, live
 * or past is never stored: it is worked out from the clock on demand, which
 * is how an event moves to "Past" by itself.
 */
export class Event extends Entity {
  static readonly MAX_GALLERY = 24;
  static readonly MAX_LINKS = 12;

  private constructor(
    id: string,
    private state: EventState,
  ) {
    super(id);
  }

  /* ---------- construction ---------- */

  static create(
    input: CreateEventInput,
    ctx: { id: string; ownerId: string; slug: string; now: Date; position?: number },
  ): Event {
    const fields = Event.validate(input);
    return new Event(ctx.id, {
      ...fields,
      ownerId: ctx.ownerId,
      slug: ctx.slug,
      position: ctx.position ?? 0,
      createdAt: ctx.now,
      updatedAt: ctx.now,
    });
  }

  /** Rebuilds an event from storage. Data is re-validated so a bad file cannot create a bad entity. */
  static restore(record: EventRecord): Event {
    const fields = Event.validate(record);
    return new Event(record.id, {
      ...fields,
      ownerId: Guard.text(record.ownerId, "ownerId", { min: 1, max: 64 }),
      slug: record.slug,
      position: record.position ?? 0,
      createdAt: Guard.date(record.createdAt, "createdAt"),
      updatedAt: Guard.date(record.updatedAt, "updatedAt"),
    });
  }

  private static validate(input: CreateEventInput) {
    const startsAt = Guard.date(input.startsAt, "Start time");
    const endsAt = Guard.date(input.endsAt, "End time");
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new ValidationError("The event must end after it starts.", "endsAt");
    }
    const gallery = (input.gallery ?? []).map((img) => ImageLink.create(img));
    const links = (input.links ?? []).map((link) => EventLink.create(link));
    Guard.maxItems(gallery, "Gallery", Event.MAX_GALLERY);
    Guard.maxItems(links, "Links", Event.MAX_LINKS);

    return {
      title: Guard.text(input.title, "Title", { min: 3, max: 120 }),
      description: Guard.optionalText(input.description, "Description", 2000),
      category: Guard.text(input.category, "Category", { min: 1, max: 40 }),
      organizer: Guard.optionalText(input.organizer, "Organizer", 80),
      venue: Guard.optionalText(input.venue, "Venue", 120),
      emoji: Guard.optionalText(input.emoji, "Emoji", 8) || "📅",
      startsAt,
      endsAt,
      coverImage: input.coverImage ? ImageLink.create(input.coverImage) : null,
      gallery,
      links,
      hidden: input.hidden === true,
    };
  }

  /* ---------- read model ---------- */

  get ownerId(): string {
    return this.state.ownerId;
  }
  get hidden(): boolean {
    return this.state.hidden;
  }
  isOwnedBy(userId: string): boolean {
    return this.state.ownerId === userId;
  }
  get slug(): string {
    return this.state.slug;
  }
  get title(): string {
    return this.state.title;
  }
  get category(): string {
    return this.state.category;
  }
  get startsAt(): Date {
    return new Date(this.state.startsAt);
  }
  get endsAt(): Date {
    return new Date(this.state.endsAt);
  }
  get gallery(): readonly ImageLink[] {
    return this.state.gallery;
  }
  get links(): readonly EventLink[] {
    return this.state.links;
  }
  get position(): number {
    return this.state.position;
  }

  status(now: Date): EventStatus {
    const t = now.getTime();
    if (t < this.state.startsAt.getTime()) return "upcoming";
    if (t < this.state.endsAt.getTime()) return "live";
    return "past";
  }

  /** People can only review what has already started. */
  acceptsReviews(now: Date): boolean {
    return this.status(now) !== "upcoming";
  }

  /** Case-insensitive match against the fields people search by. */
  matches(text: string): boolean {
    const needle = text.trim().toLowerCase();
    if (!needle) return true;
    const s = this.state;
    return [s.title, s.description, s.category, s.organizer, s.venue].some((v) => v.toLowerCase().includes(needle));
  }

  /* ---------- behaviour ---------- */

  update(patch: UpdateEventInput, now: Date): void {
    const merged: CreateEventInput = { ...this.toRecord(), ...patch };
    const fields = Event.validate(merged);
    this.state = { ...this.state, ...fields, updatedAt: now };
  }

  addImage(image: ImageLink, now: Date): void {
    if (this.state.gallery.some((img) => img.url === image.url)) {
      throw new BusinessRuleError("That image is already in the gallery.");
    }
    if (this.state.gallery.length >= Event.MAX_GALLERY) {
      throw new BusinessRuleError(`A gallery can hold at most ${Event.MAX_GALLERY} images.`);
    }
    this.state = { ...this.state, gallery: [...this.state.gallery, image], updatedAt: now };
  }

  removeImage(url: string, now: Date): void {
    this.state = { ...this.state, gallery: this.state.gallery.filter((img) => img.url !== url), updatedAt: now };
  }

  moveTo(position: number, now: Date): void {
    this.state = { ...this.state, position, updatedAt: now };
  }

  toRecord(): EventRecord {
    const s = this.state;
    return {
      id: this.id,
      ownerId: s.ownerId,
      slug: s.slug,
      title: s.title,
      description: s.description,
      category: s.category,
      organizer: s.organizer,
      venue: s.venue,
      emoji: s.emoji,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      coverImage: s.coverImage?.toDTO() ?? null,
      gallery: s.gallery.map((img) => img.toDTO()),
      links: s.links.map((link) => link.toDTO()),
      position: s.position,
      hidden: s.hidden,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
