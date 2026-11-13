import { useRef, useState, type FormEvent } from "react";
import { ApiError, type EventDTO, type ImageLinkDTO } from "@event-tree/api-client";
import { api } from "../../lib/api";
import { IMAGE_ACCEPT, imageProblem } from "../../lib/upload";

interface Props {
  event: EventDTO;
  onUpdated: (event: EventDTO) => void;
}

/** Photo grid for an event, plus a small form for visitors to upload their own photo. */
export function ImageGallery({ event, onUpdated }: Props) {
  const [open, setOpen] = useState<ImageLinkDTO | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  function pick(next: File | undefined) {
    const problem = next ? imageProblem(next) : null;
    setError(problem ?? "");
    setFile(next && !problem ? next : null);
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!file) return picker.current?.click();
    setError("");
    setBusy(true);
    try {
      onUpdated(await api.uploadEventPhoto(event.id, file, file.type, caption));
      setFile(null);
      setCaption("");
      if (picker.current) picker.current.value = "";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2 className="head">Photos</h2>
      {event.gallery.length === 0 ? (
        <p className="muted center">No photos yet. Were you there? Add yours below.</p>
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
        <input ref={picker} type="file" accept={IMAGE_ACCEPT} onChange={(e) => pick(e.target.files?.[0])} aria-label="Choose a photo" />
        <input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} aria-label="Caption" />
        <button className="primary" disabled={busy}>
          {busy ? "Uploading…" : "Add photo"}
        </button>
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
