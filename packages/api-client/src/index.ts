export { EventTreeClient, type ImageBody } from "./EventTreeClient";
export { EMAIL_NOT_VERIFIED, NeonAuthSession, friendlyAuthMessage, type AuthUser, type SessionStore } from "./NeonAuthSession";
export { HttpTransport, type FetchLike, type TransportOptions } from "./HttpTransport";
export { ApiError } from "./ApiError";
export { Format } from "./format";

// Re-export the DTO types so apps only need this one package.
export type {
  AddImageInput,
  AnalyticsDayDTO,
  AnalyticsSummaryDTO,
  AppearanceDTO,
  ClaimPageInput,
  ButtonStyle,
  FontChoice,
  MeDTO,
  ThemeColors,
  ThemePreset,
  TreeDTO,
  UpdateProfileInput,
  UploadDTO,
  UserDTO,
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
  SocialPlatform,
  UpdateEventInput,
} from "@event-tree/core";
