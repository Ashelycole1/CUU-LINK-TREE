import type {
  AddImageInput,
  AnalyticsSummaryDTO,
  ClaimPageInput,
  CreateEventInput,
  CreateReviewInput,
  EventDTO,
  EventListQuery,
  MeDTO,
  ProfileDTO,
  RatingSummaryDTO,
  ReviewDTO,
  ThemePreset,
  TreeDTO,
  UpdateEventInput,
  UpdateProfileInput,
  UploadDTO,
  UserDTO,
} from "@event-tree/core";
import { HttpTransport, type TransportOptions } from "./HttpTransport";

const seg = encodeURIComponent;

/** Raw image data: a Blob or File in browsers and React Native, or bytes. */
export type ImageBody = Blob | ArrayBuffer | Uint8Array;

/**
 * The Event Tree API as typed methods, grouped the way the product is:
 * accounts, public pages, visitor actions, and the host dashboard.
 * Sign-in itself is Neon Auth (see NeonAuthSession); this client sends its JWT. The web and
 * mobile apps both create one; neither writes a URL by hand.
 */
export class EventTreeClient {
  static readonly API_PREFIX = "/api/v1";
  private readonly http: HttpTransport;

  constructor(options: TransportOptions) {
    const root = options.baseUrl.replace(/\/+$/, "");
    this.http = new HttpTransport({ ...options, baseUrl: `${root}${EventTreeClient.API_PREFIX}` });
  }

  /* ---------- accounts ---------- */
  /** The signed-in person; `user` is null until they claim a username. */
  me(): Promise<MeDTO> {
    return this.http.get("/auth/me");
  }

  /** Claims a username for the signed-in person, which creates their page. */
  claim(input: ClaimPageInput): Promise<UserDTO> {
    return this.http.post("/auth/claim", input);
  }

  checkUsername(username: string): Promise<{ username: string; available: boolean; reason?: string }> {
    return this.http.get(`/auth/username/${seg(username)}`);
  }

  /* ---------- public pages ---------- */
  getThemes(): Promise<ThemePreset[]> {
    return this.http.get("/themes");
  }

  getPage(username: string): Promise<TreeDTO> {
    return this.http.get(`/pages/${seg(username)}`);
  }

  listPageEvents(username: string, query: EventListQuery = {}): Promise<EventDTO[]> {
    return this.http.get(`/pages/${seg(username)}/events`, { ...query });
  }

  getPageEvent(username: string, slug: string): Promise<EventDTO> {
    return this.http.get(`/pages/${seg(username)}/events/${seg(slug)}`);
  }

  recordView(username: string): Promise<void> {
    return this.http.post(`/pages/${seg(username)}/views`, {});
  }

  /* ---------- visitor actions on one event ---------- */
  recordClick(eventId: string): Promise<void> {
    return this.http.post(`/events/${seg(eventId)}/clicks`, {});
  }

  listReviews(eventId: string): Promise<ReviewDTO[]> {
    return this.http.get(`/events/${seg(eventId)}/reviews`);
  }

  getRatingSummary(eventId: string): Promise<RatingSummaryDTO> {
    return this.http.get(`/events/${seg(eventId)}/reviews/summary`);
  }

  addReview(eventId: string, review: CreateReviewInput): Promise<ReviewDTO> {
    return this.http.post(`/events/${seg(eventId)}/reviews`, review);
  }

  addImage(eventId: string, image: AddImageInput): Promise<EventDTO> {
    return this.http.post(`/events/${seg(eventId)}/images`, image);
  }

  /** A visitor's own photo for the event's gallery (JPEG, PNG, GIF or WebP, up to 5 MB). */
  uploadEventPhoto(eventId: string, file: ImageBody, contentType: string, caption?: string): Promise<EventDTO> {
    return this.http.upload(`/events/${seg(eventId)}/photos`, file, contentType, { caption: caption?.trim() || undefined });
  }

  /* ---------- host dashboard (needs a token) ---------- */
  /** Stores an avatar, header image or poster and returns the link to save on the profile or event. */
  uploadImage(file: ImageBody, contentType: string): Promise<UploadDTO> {
    return this.http.upload("/me/uploads", file, contentType);
  }

  getMyProfile(): Promise<ProfileDTO> {
    return this.http.get("/me/profile");
  }

  updateMyProfile(patch: UpdateProfileInput): Promise<ProfileDTO> {
    return this.http.patch("/me/profile", patch);
  }

  listMyEvents(): Promise<EventDTO[]> {
    return this.http.get("/me/events");
  }

  createEvent(input: CreateEventInput): Promise<EventDTO> {
    return this.http.post("/me/events", input);
  }

  updateEvent(eventId: string, patch: UpdateEventInput): Promise<EventDTO> {
    return this.http.patch(`/me/events/${seg(eventId)}`, patch);
  }

  deleteEvent(eventId: string): Promise<void> {
    return this.http.delete(`/me/events/${seg(eventId)}`);
  }

  reorderEvents(ids: string[]): Promise<EventDTO[]> {
    return this.http.put("/me/events/order", { ids });
  }

  getAnalytics(days = 14): Promise<AnalyticsSummaryDTO> {
    return this.http.get("/me/analytics", { days });
  }
}
