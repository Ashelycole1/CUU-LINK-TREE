import type { Event } from "./Event";

/**
 * Storage contract for events. Services depend on this interface only, so
 * the JSON file store, an in-memory store or a future SQL store can be
 * swapped without touching business logic (dependency inversion).
 */
export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findByOwner(ownerId: string): Promise<Event[]>;
  /** Slugs are unique per owner, so `/jazzfest/opening-night` and `/runclub/opening-night` can coexist. */
  findBySlug(ownerId: string, slug: string): Promise<Event | null>;
  save(event: Event): Promise<void>;
  delete(id: string): Promise<void>;
}
