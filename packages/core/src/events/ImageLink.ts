import { ValueObject } from "../shared/Entity";
import { Guard } from "../shared/guards";
import type { ImageLinkDTO } from "../dto";

interface ImageLinkProps {
  url: string;
  alt: string;
  caption: string;
}

/**
 * A picture referenced by URL (poster, cover photo, gallery shot).
 * The app stores links, not files, so any public image host works.
 * Mirrors Linktree's `thumbnail` / `thumbnailUrl` on a link.
 */
export class ImageLink extends ValueObject<ImageLinkProps> {
  static readonly MAX_ALT = 160;
  static readonly MAX_CAPTION = 200;

  private constructor(props: ImageLinkProps) {
    super(props);
  }

  static create(input: { url: unknown; alt?: unknown; caption?: unknown }): ImageLink {
    return new ImageLink({
      url: Guard.httpUrl(input.url, "Image link"),
      alt: Guard.optionalText(input.alt, "Image description", ImageLink.MAX_ALT),
      caption: Guard.optionalText(input.caption, "Caption", ImageLink.MAX_CAPTION),
    });
  }

  get url(): string {
    return this.props.url;
  }

  get alt(): string {
    return this.props.alt;
  }

  get caption(): string {
    return this.props.caption;
  }

  toDTO(): ImageLinkDTO {
    return { url: this.url, alt: this.alt, caption: this.caption };
  }
}
