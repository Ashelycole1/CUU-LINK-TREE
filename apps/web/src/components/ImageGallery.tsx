import { useState, type FormEvent } from "react";
import { ApiError, type EventDTO, type ImageLinkDTO } from "@event-tree/api-client";
import { api } from "../lib/api";

interface Props {
  event: EventDTO;
  onUpdated: (event: EventDTO) => void;
}

/** Photo grid for an event, plus a small form to add a picture by link. */
export function ImageGallery({ event, onUpdated }: Props) {
  const [open, setOpen] = useState<ImageLinkDTO | null>(null);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  async function add(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      onUpdated(await api().addImage(event.slug, { url, caption, alt: caption }));
      setUrl("");
      setCaption("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add that image.");
    }
  }

  return (
    <section>
      <h2 className="head">Photos</h2>
      {event.gallery.length === 0 ? (
        <p className="muted center">No photos yet. Add a link to one below.</p>
      ) : (
        <div className="gallery">
          {event.gallery.map((img) => (
            <button key={img.url} type="button" onClick={() => setOpen(img)} aria-label={img.alt || "Open photo"}>
              <img src={img.url} alt={img.alt} loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <form className="inline-form" onSubmit={add}>
        <input type="url" placeholder="https://… image link" value={url} onChange={(e) => setUrl(e.target.value)} required aria-label="Image link" />
        <input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} aria-label="Caption" />
        <button className="primary">Add photo</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <figure>
            <img src={open.url} alt={open.alt} />
            {open.caption && <figcaption>{open.caption}</figcaption>}
          </figure>
        </div>
      )}
    </section>
  );
}
