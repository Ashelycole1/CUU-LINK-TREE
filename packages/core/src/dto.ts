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

/* ---------- events ---------- */

/** What is persisted for an event. */
export interface EventRecord {
  id: string;
  ownerId: string;
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
  /** Hidden events stay in the dashboard but are not shown on the public page (Linktree's on/off switch). */
  hidden: boolean;
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

/* ---------- reviews ---------- */

export interface ReviewRecord {
  id: string;
  eventId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type ReviewDTO = ReviewRecord;

/* ---------- profile & appearance ---------- */

export type SocialPlatform = "instagram" | "x" | "linkedin" | "whatsapp" | "youtube" | "tiktok" | "facebook" | "website";

export interface SocialLinkDTO {
  platform: SocialPlatform;
  url: string;
}

export interface ThemeColors {
  background: string;
  text: string;
  card: string;
  cardText: string;
  accent: string;
}

/** ticket = notched stub (the house style), pill, outline, shadow = hard offset shadow. */
export type ButtonStyle = "ticket" | "pill" | "outline" | "shadow";
export type FontChoice = "bricolage" | "figtree" | "fraunces";

export interface AppearanceDTO {
  themeId: string;
  colors: ThemeColors;
  buttonStyle: ButtonStyle;
  font: FontChoice;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
  buttonStyle: ButtonStyle;
  font: FontChoice;
}

/** A host's public page settings. One per user, addressed by username. */
export interface ProfileDTO {
  ownerId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  heroImageUrl: string;
  socials: SocialLinkDTO[];
  appearance: AppearanceDTO;
}

export type UpdateProfileInput = Partial<Pick<ProfileDTO, "displayName" | "bio" | "avatarUrl" | "heroImageUrl" | "socials">> & {
  appearance?: Partial<Omit<AppearanceDTO, "colors">> & { colors?: Partial<ThemeColors> };
};

/** Everything the public page needs in one call. */
export interface TreeDTO {
  profile: ProfileDTO;
  upcoming: EventDTO[];
  past: EventDTO[];
  categories: string[];
}

/* ---------- users & auth ---------- */

/** A host: a Neon Auth identity (id = JWT sub) linked to one username and page. */
export interface UserRecord {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

/** Claim a username after signing up with Neon Auth. This creates the page. */
export interface ClaimPageInput {
  username: string;
  displayName?: string;
}

/** The signed-in person; `user` is null until they claim a username. */
export interface MeDTO {
  identity: { id: string; email: string };
  user: UserDTO | null;
}

/* ---------- uploads ---------- */

export interface UploadDTO {
  /** Absolute address the image is served from, e.g. https://…/media/u/<id>/<file>.jpg */
  url: string;
}

/* ---------- analytics ---------- */

export type AnalyticsType = "view" | "click";

export interface AnalyticsRecord {
  id: string;
  ownerId: string;
  type: AnalyticsType;
  eventId: string | null;
  at: string;
}

export interface AnalyticsDayDTO {
  date: string;
  views: number;
  clicks: number;
}

export interface AnalyticsSummaryDTO {
  days: number;
  views: number;
  clicks: number;
  /** clicks / views, 0–1. */
  clickRate: number;
  series: AnalyticsDayDTO[];
  topEvents: { eventId: string; title: string; clicks: number }[];
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
  hidden?: boolean;
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
