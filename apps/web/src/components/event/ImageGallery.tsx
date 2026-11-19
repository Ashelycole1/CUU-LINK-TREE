import { useRef, useState, type FormEvent } from "react";
import { ApiError, type EventDTO, type ImageLinkDTO } from "@event-tree/api-client";
import { api } from "../../lib/api";
import { IMAGE_ACCEPT, IMAGE_SIZES, compressImage, imageProblem } from "../../lib/upload";
import { useDialog } from "../../lib/useDialog";
import { InlineError } from "../ui/Input";
import { Icon } from "../ui/Icon";
import { posthog } from "../../lib/posthog";

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
      const image = await compressImage(file, IMAGE_SIZES.photo);
      onUpdated(await api.uploadEventPhoto(event.id, image, image.type || file.type, caption));
      posthog.capture("photo_uploaded");
      setFile(null);
      setCaption("");
      if (picker.current) picker.current.value = "";
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Could not add that photo.");
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
        <button className="primary" disabled={busy} aria-busy={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? "Uploading…" : "Add photo"}
        </button>
      </form>
      {error && <InlineError>{error}</InlineError>}

      {open && <Lightbox image={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

/** A full-screen photo. Closes with the button, Escape, or a click on the dark area. */
function Lightbox({ image, onClose }: { image: ImageLinkDTO; onClose: () => void }) {
  const closeBtn = useDialog<HTMLButtonElement>(true, onClose);
  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={image.caption || image.alt || "Photo"}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button ref={closeBtn} type="button" className="lightbox-close" onClick={onClose} aria-label="Close photo">
        <Icon name="close" size={22} />
      </button>
      <figure>
        <img src={image.url} alt={image.alt} />
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>
    </div>
  );
}
