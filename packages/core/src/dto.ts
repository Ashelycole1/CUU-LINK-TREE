/**
 * Plain data shapes that cross boundaries: HTTP JSON, storage, and the
 * web and mobile clients. Entities convert to and from these; UI code only
 * ever sees DTOs, never entity instances.
 */

export type EventStatus = "upcoming" | "live" | "past";

export type EventLinkKind =
  | "register"
  | "tickets"
  | "agenda"
  | "livestream"
  | "slides"
  | "photos"
  | "recording"
  | "other";

export interface ImageLinkDTO {
  url: string;
  alt: string;
  caption: string;
}

export interface EventLinkDTO {
  label: string;
  url: string;
  kind: EventLinkKind;
  primary: boolean;
}

/** What is persisted for an event. */
export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  organizer: string;
  venue: string;
  emoji: string;
  startsAt: string;
  endsAt: string;
  coverImage: ImageLinkDTO | null;
  gallery: ImageLinkDTO[];
  links: EventLinkDTO[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummaryDTO {
  count: number;
  average: number;
  /** Index 0 holds the number of 1-star reviews, index 4 the 5-star ones. */
  distribution: [number, number, number, number, number];
}

/** What clients receive: the record plus values computed at request time. */
export interface EventDTO extends EventRecord {
  status: EventStatus;
  acceptsReviews: boolean;
  rating: RatingSummaryDTO;
}

export interface ReviewRecord {
  id: string;
  eventId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type ReviewDTO = ReviewRecord;

export interface SocialLinkDTO {
  platform: "instagram" | "x" | "linkedin" | "whatsapp" | "youtube" | "tiktok" | "facebook" | "website";
  url: string;
}

export interface ThemeDTO {
  background: string;
  text: string;
  card: string;
  cardText: string;
  accent: string;
}

export interface ProfileDTO {
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  avatarText: string;
  heroImageUrl: string;
  socials: SocialLinkDTO[];
  theme: ThemeDTO;
}

/* ---------- inputs ---------- */

export interface CreateEventInput {
  title: string;
  description?: string;
  category: string;
  organizer?: string;
  venue?: string;
  emoji?: string;
  startsAt: string;
  endsAt: string;
  coverImage?: { url: string; alt?: string; caption?: string } | null;
  gallery?: { url: string; alt?: string; caption?: string }[];
  links?: { label: string; url: string; kind?: EventLinkKind; primary?: boolean }[];
}

export type UpdateEventInput = Partial<CreateEventInput>;

export interface AddImageInput {
  url: string;
  alt?: string;
  caption?: string;
}

export interface CreateReviewInput {
  authorName: string;
  rating: number;
  comment?: string;
}

export interface EventListQuery {
  /** "upcoming" includes events happening right now. */
  when?: "upcoming" | "past" | "all";
  category?: string;
  q?: string;
  limit?: number;
}
