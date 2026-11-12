export { EventTreeClient } from "./EventTreeClient";
export { HttpTransport, type FetchLike, type TransportOptions } from "./HttpTransport";
export { ApiError } from "./ApiError";
export { Format } from "./format";

// Re-export the DTO types so apps only need this one package.
export type {
  AddImageInput,
  CreateEventInput,
  CreateReviewInput,
  EventDTO,
  EventLinkDTO,
  EventLinkKind,
  EventListQuery,
  EventStatus,
  ImageLinkDTO,
  ProfileDTO,
  RatingSummaryDTO,
  ReviewDTO,
  SocialLinkDTO,
  ThemeDTO,
  UpdateEventInput,
} from "@event-tree/core";
