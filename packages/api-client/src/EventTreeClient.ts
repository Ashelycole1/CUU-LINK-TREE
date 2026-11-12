import type {
  AddImageInput,
  CreateEventInput,
  CreateReviewInput,
  EventDTO,
  EventListQuery,
  ProfileDTO,
  RatingSummaryDTO,
  ReviewDTO,
  UpdateEventInput,
} from "@event-tree/core";
import { HttpTransport, type TransportOptions } from "./HttpTransport";

/**
 * The Event Tree API as typed methods. The web and mobile apps both create
 * one of these; neither writes a URL or parses a response by hand.
 */
export class EventTreeClient {
  static readonly API_PREFIX = "/api/v1";
  private readonly http: HttpTransport;

  constructor(options: TransportOptions) {
    const root = options.baseUrl.replace(/\/+$/, "");
    this.http = new HttpTransport({ ...options, baseUrl: `${root}${EventTreeClient.API_PREFIX}` });
  }

  /* profile */
  getProfile(): Promise<ProfileDTO> {
    return this.http.get("/profile");
  }

  getCategories(): Promise<string[]> {
    return this.http.get("/categories");
  }

  /* events */
  listEvents(query: EventListQuery = {}): Promise<EventDTO[]> {
    return this.http.get("/events", { ...query });
  }

  getEvent(idOrSlug: string): Promise<EventDTO> {
    return this.http.get(`/events/${encodeURIComponent(idOrSlug)}`);
  }

  createEvent(input: CreateEventInput): Promise<EventDTO> {
    return this.http.post("/events", input);
  }

  updateEvent(idOrSlug: string, patch: UpdateEventInput): Promise<EventDTO> {
    return this.http.patch(`/events/${encodeURIComponent(idOrSlug)}`, patch);
  }

  deleteEvent(idOrSlug: string): Promise<void> {
    return this.http.delete(`/events/${encodeURIComponent(idOrSlug)}`);
  }

  addImage(idOrSlug: string, image: AddImageInput): Promise<EventDTO> {
    return this.http.post(`/events/${encodeURIComponent(idOrSlug)}/images`, image);
  }

  /* reviews */
  listReviews(idOrSlug: string): Promise<ReviewDTO[]> {
    return this.http.get(`/events/${encodeURIComponent(idOrSlug)}/reviews`);
  }

  getRatingSummary(idOrSlug: string): Promise<RatingSummaryDTO> {
    return this.http.get(`/events/${encodeURIComponent(idOrSlug)}/reviews/summary`);
  }

  addReview(idOrSlug: string, review: CreateReviewInput): Promise<ReviewDTO> {
    return this.http.post(`/events/${encodeURIComponent(idOrSlug)}/reviews`, review);
  }
}
