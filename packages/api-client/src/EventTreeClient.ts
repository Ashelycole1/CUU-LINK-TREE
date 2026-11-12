import type {
  AddImageInput,
  AnalyticsSummaryDTO,
  AuthSessionDTO,
  CreateEventInput,
  CreateReviewInput,
  EventDTO,
  EventListQuery,
  LoginInput,
  ProfileDTO,
  RatingSummaryDTO,
  ReviewDTO,
  SignupInput,
  ThemePreset,
  TreeDTO,
  UpdateEventInput,
  UpdateProfileInput,
  UserDTO,
} from "@event-tree/core";
import { HttpTransport, type TransportOptions } from "./HttpTransport";

const seg = encodeURIComponent;

/**
 * The Event Tree API as typed methods, grouped the way the product is:
 * auth, public pages, visitor actions, and the host dashboard. The web and
 * mobile apps both create one; neither writes a URL by hand.
 */
export class EventTreeClient {
  static readonly API_PREFIX = "/api/v1";
  private readonly http: HttpTransport;

  constructor(options: TransportOptions) {
    const root = options.baseUrl.replace(/\/+$/, "");
    this.http = new HttpTransport({ ...options, baseUrl: `${root}${EventTreeClient.API_PREFIX}` });
  }

  /* ---------- auth ---------- */
  signup(input: SignupInput): Promise<AuthSessionDTO> {
    return this.http.post("/auth/signup", input);
  }

  login(input: LoginInput): Promise<AuthSessionDTO> {
    return this.http.post("/auth/login", input);
  }

  me(): Promise<UserDTO> {
    return this.http.get("/auth/me");
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

  /* ---------- host dashboard (needs a token) ---------- */
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
