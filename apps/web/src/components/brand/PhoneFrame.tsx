import type { ReactNode } from "react";

type Props =
  | {
      /** A real public page, loaded in preview mode (no views or clicks counted). */
      username: string;
      /** Change this to reload the preview after an edit. */
      version?: number;
      title?: string;
      children?: never;
    }
  | {
      /** Content rendered straight into the screen, e.g. the landing page sample. */
      children: ReactNode;
      title: string;
      username?: never;
      version?: never;
    };

/** A phone-shaped frame. Used on the landing page and beside the dashboard editor. */
export function PhoneFrame({ username, version = 0, title, children }: Props) {
  return (
    <div className="phone">
      <div className="phone-notch" aria-hidden="true" />
      {children !== undefined ? (
        <div className="phone-screen" role="img" aria-label={title}>
          {children}
        </div>
      ) : (
        <iframe
          key={version}
          src={`/${username}?preview=1&v=${version}`}
          title={title ?? `Preview of /${username}`}
          loading="lazy"
        />
      )}
    </div>
  );
}
