import { useState, type FormEvent } from "react";
import { ApiError, type CreateEventInput, type EventDTO, type EventLinkKind } from "@event-tree/api-client";
import { adminKeyStore, api } from "../lib/api";

const KINDS: EventLinkKind[] = ["register", "tickets", "agenda", "livestream", "slides", "photos", "recording", "other"];

interface LinkRow {
  label: string;
  url: string;
  kind: EventLinkKind;
}

interface Props {
  categories: string[];
  onCreated: (event: EventDTO) => void;
}

/** datetime-local gives "2026-12-05T14:00" in the viewer's time zone; the API wants ISO with an offset. */
const toIso = (local: string) => (local ? new Date(local).toISOString() : "");

/** Form for posting a new event, with a cover image link and any number of buttons. */
export function EventForm({ categories, onCreated }: Props) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    emoji: "📅",
    startsAt: "",
    endsAt: "",
    venue: "",
    organizer: "",
    description: "",
    coverUrl: "",
    coverAlt: "",
  });
  const [links, setLinks] = useState<LinkRow[]>([{ label: "Register", url: "", kind: "register" }]);
  const [adminKey, setAdminKey] = useState(adminKeyStore.get());
  const [needsKey, setNeedsKey] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const setLink = (i: number, patch: Partial<LinkRow>) => setLinks(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    adminKeyStore.set(adminKey);
    const input: CreateEventInput = {
      title: form.title,
      category: form.category,
      emoji: form.emoji,
      startsAt: toIso(form.startsAt),
      endsAt: toIso(form.endsAt),
      venue: form.venue,
      organizer: form.organizer,
      description: form.description,
      coverImage: form.coverUrl ? { url: form.coverUrl, alt: form.coverAlt || `${form.title} poster` } : null,
      links: links
        .filter((l) => l.url.trim())
        .map((l, i) => ({ label: l.label || "Link", url: l.url, kind: l.kind, primary: i === 0 })),
    };
    try {
      onCreated(await api().createEvent(input));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setNeedsKey(true);
      setError(err instanceof ApiError ? { message: err.message, field: err.field } : { message: "Could not post the event." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <label>
        Title
        <input value={form.title} onChange={set("title")} required minLength={3} maxLength={120} />
      </label>
      <div className="row">
        <label className="grow">
          Category
          <input value={form.category} onChange={set("category")} list="categories" required maxLength={40} />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="narrow">
          Emoji
          <input value={form.emoji} onChange={set("emoji")} maxLength={8} />
        </label>
      </div>
      <div className="row">
        <label className="grow">
          Starts
          <input type="datetime-local" value={form.startsAt} onChange={set("startsAt")} required />
        </label>
        <label className="grow">
          Ends
          <input type="datetime-local" value={form.endsAt} onChange={set("endsAt")} required min={form.startsAt} />
        </label>
      </div>
      <label>
        Venue
        <input value={form.venue} onChange={set("venue")} maxLength={120} />
      </label>
      <label>
        Organiser
        <input value={form.organizer} onChange={set("organizer")} maxLength={80} />
      </label>
      <label>
        Description
        <textarea value={form.description} onChange={set("description")} rows={4} maxLength={2000} />
      </label>

      <fieldset>
        <legend>Poster image link</legend>
        <input type="url" placeholder="https://… (jpg, png, webp)" value={form.coverUrl} onChange={set("coverUrl")} aria-label="Poster image link" />
        {form.coverUrl && <img className="preview" src={form.coverUrl} alt="Poster preview" />}
        <input placeholder="Describe the image (for screen readers)" value={form.coverAlt} onChange={set("coverAlt")} aria-label="Image description" />
      </fieldset>

      <fieldset>
        <legend>Buttons</legend>
        {links.map((l, i) => (
          <div className="row link-row" key={i}>
            <input placeholder="Label" value={l.label} onChange={(e) => setLink(i, { label: e.target.value })} aria-label="Button label" />
            <select value={l.kind} onChange={(e) => setLink(i, { kind: e.target.value as EventLinkKind })} aria-label="Button type">
              {KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            <input type="url" placeholder="https://…" value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} aria-label="Button link" />
            <button type="button" className="chip" onClick={() => setLinks(links.filter((_, j) => j !== i))} aria-label="Remove button">
              ✕
            </button>
          </div>
        ))}
        {links.length < 12 && (
          <button type="button" className="chip" onClick={() => setLinks([...links, { label: "", url: "", kind: "other" }])}>
            + Add button
          </button>
        )}
      </fieldset>

      {(needsKey || adminKey) && (
        <label>
          Admin key
          <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} autoComplete="off" />
        </label>
      )}

      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      <button className="primary" disabled={busy}>
        {busy ? "Posting…" : "Post event"}
      </button>
    </form>
  );
}
