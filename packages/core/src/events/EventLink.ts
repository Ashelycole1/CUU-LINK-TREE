import { ValueObject } from "../shared/Entity";
import { ValidationError } from "../shared/errors";
import { Guard } from "../shared/guards";
import type { EventLinkDTO, EventLinkKind } from "../dto";

export const EVENT_LINK_KINDS: readonly EventLinkKind[] = [
  "register",
  "tickets",
  "agenda",
  "livestream",
  "slides",
  "photos",
  "recording",
  "other",
];

interface EventLinkProps {
  label: string;
  url: string;
  kind: EventLinkKind;
  primary: boolean;
}

/**
 * One button inside an event (Register, Slides, Photos...).
 * The equivalent of a Linktree "CLASSIC" link, with a `kind` in place of
 * Linktree's link `type` so the UI can pick an icon and know which links
 * belong before or after the event.
 */
export class EventLink extends ValueObject<EventLinkProps> {
  private constructor(props: EventLinkProps) {
    super(props);
  }

  static create(input: { label: unknown; url: unknown; kind?: unknown; primary?: unknown }): EventLink {
    const kind = (input.kind ?? "other") as EventLinkKind;
    if (!EVENT_LINK_KINDS.includes(kind)) {
      throw new ValidationError(`Link type must be one of: ${EVENT_LINK_KINDS.join(", ")}.`, "kind");
    }
    return new EventLink({
      label: Guard.text(input.label, "Link label", { min: 1, max: 40 }),
      url: Guard.httpUrl(input.url, "Link"),
      kind,
      primary: input.primary === true,
    });
  }

  get label(): string {
    return this.props.label;
  }

  get url(): string {
    return this.props.url;
  }

  get kind(): EventLinkKind {
    return this.props.kind;
  }

  get primary(): boolean {
    return this.props.primary;
  }

  /** Recap links (slides, photos, recording) are the ones that matter after an event. */
  isRecap(): boolean {
    return this.kind === "slides" || this.kind === "photos" || this.kind === "recording";
  }

  toDTO(): EventLinkDTO {
    return { label: this.label, url: this.url, kind: this.kind, primary: this.primary };
  }
}
