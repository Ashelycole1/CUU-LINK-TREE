interface Props {
  username: string;
  /** Change this to reload the preview after an edit. */
  version?: number;
  title?: string;
}

/**
 * A phone-shaped frame showing a real public page in preview mode
 * (preview mode does not count views or clicks). Used on the landing page
 * and beside the dashboard editor.
 */
export function PhoneFrame({ username, version = 0, title }: Props) {
  return (
    <div className="phone">
      <div className="phone-notch" aria-hidden="true" />
      <iframe
        key={version}
        src={`/${username}?preview=1&v=${version}`}
        title={title ?? `Preview of /${username}`}
        loading="lazy"
      />
    </div>
  );
}
