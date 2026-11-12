export { EventTreeClient } from "./EventTreeClient";
export { HttpTransport, type FetchLike, type TransportOptions } from "./HttpTransport";
export { ApiError } from "./ApiError";
export { Format } from "./format";

// Re-export the DTO types so apps only need this one package.
export type {
  AddImageInput,
  AnalyticsDayDTO,
  AnalyticsSummaryDTO,
  AppearanceDTO,
  AuthSessionDTO,
  ButtonStyle,
  FontChoice,
  LoginInput,
  SignupInput,
  ThemeColors,
  ThemePreset,
  TreeDTO,
  UpdateProfileInput,
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
