import { useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import { ApiError, type CreateEventInput, type EventDTO, type EventLinkKind } from "@event-tree/api-client";

const KINDS: { id: EventLinkKind; label: string }[] = [
  { id: "register", label: "Register" },
  { id: "tickets", label: "Tickets" },
  { id: "agenda", label: "Agenda" },
  { id: "livestream", label: "Livestream" },
  { id: "slides", label: "Slides" },
  { id: "photos", label: "Photos" },
  { id: "recording", label: "Recording" },
  { id: "other", label: "Other" },
];

interface LinkRow {
  label: string;
  url: string;
  kind: EventLinkKind;
}

interface Props {
  /** Editing an existing event when set; creating a new one otherwise. */
  event?: EventDTO;
  onSave: (input: CreateEventInput) => Promise<void>;
  onCancel: () => void;
}

/** ISO → value for <input type="datetime-local"> in the viewer's time zone. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const toIso = (local: string) => (local ? new Date(local).toISOString() : "");

/** The add/edit form for one event, used inline in the dashboard list. */
export function EventEditor({ event, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    title: event?.title ?? "",
    category: event?.category ?? "",
    emoji: event?.emoji ?? "📅",
    startsAt: event ? toLocalInput(event.startsAt) : "",
    endsAt: event ? toLocalInput(event.endsAt) : "",
    venue: event?.venue ?? "",
    organizer: event?.organizer ?? "",
    description: event?.description ?? "",
    coverUrl: event?.coverImage?.url ?? "",
    coverAlt: event?.coverImage?.alt ?? "",
  });
  const [links, setLinks] = useState<LinkRow[]>(
    event?.links.map((l) => ({ label: l.label, url: l.url, kind: l.kind })) ?? [{ label: "Register", url: "", kind: "register" }],
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });
  const setLink = (i: number, patch: Partial<LinkRow>) => setLinks(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({
        title: form.title,
        category: form.category,
        emoji: form.emoji,
        startsAt: toIso(form.startsAt),
        endsAt: toIso(form.endsAt),
        venue: form.venue,
        organizer: form.organizer,
        description: form.description,
        coverImage: form.coverUrl.trim() ? { url: form.coverUrl.trim(), alt: form.coverAlt || `${form.title} poster` } : null,
        links: links
          .filter((l) => l.url.trim())
          .map((l, i) => ({ label: l.label || "Link", url: l.url.trim(), kind: l.kind, primary: i === 0 })),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this event.");
      setBusy(false);
    }
  }

  return (
    <form className="editor" onSubmit={submit}>
      <div className="editor-grid">
        <label className="span-2">
          Title
          <input value={form.title} onChange={set("title")} required minLength={3} maxLength={120} autoFocus placeholder="e.g. Opening Night" />
        </label>
        <label>
          Category
          <input value={form.category} onChange={set("category")} required maxLength={40} placeholder="Music, Talks, Sports…" />
        </label>
        <label>
          Emoji
          <input value={form.emoji} onChange={set("emoji")} maxLength={8} />
        </label>
        <label>
          Starts
          <input type="datetime-local" value={form.startsAt} onChange={set("startsAt")} required />
        </label>
        <label>
          Ends
          <input type="datetime-local" value={form.endsAt} onChange={set("endsAt")} required min={form.startsAt} />
        </label>
        <label>
          Venue
          <input value={form.venue} onChange={set("venue")} maxLength={120} />
        </label>
        <label>
          Organiser
          <input value={form.organizer} onChange={set("organizer")} maxLength={80} />
        </label>
        <label className="span-2">
          Description
          <textarea value={form.description} onChange={set("description")} rows={3} maxLength={2000} />
        </label>
        <label className="span-2">
          Poster image link
          <input type="url" value={form.coverUrl} onChange={set("coverUrl")} placeholder="https://… (jpg, png or webp)" />
        </label>
        {form.coverUrl && (
          <div className="span-2 poster-row">
            <img src={form.coverUrl} alt="" className="poster-preview" />
            <label>
              Describe the poster
              <input value={form.coverAlt} onChange={set("coverAlt")} placeholder="For screen readers" maxLength={160} />
            </label>
          </div>
        )}
      </div>

      <fieldset className="editor-links">
        <legend>Buttons on the event page</legend>
        {links.map((l, i) => (
          <div className="link-row" key={i}>
            <input placeholder="Label" value={l.label} onChange={(e) => setLink(i, { label: e.target.value })} aria-label="Button label" maxLength={40} />
            <select value={l.kind} onChange={(e) => setLink(i, { kind: e.target.value as EventLinkKind })} aria-label="Button type">
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
            <input type="url" placeholder="https://…" value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} aria-label="Button link" />
            <button type="button" className="icon-btn" onClick={() => setLinks(links.filter((_, j) => j !== i))} aria-label="Remove button">
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
        {links.length < 12 && (
          <button type="button" className="text-btn" onClick={() => setLinks([...links, { label: "", url: "", kind: "other" }])}>
            + Add a button
          </button>
        )}
      </fieldset>

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="editor-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-dark" disabled={busy}>
          {busy ? "Saving…" : event ? "Save changes" : "Add event"}
        </button>
      </div>
    </form>
  );
}
