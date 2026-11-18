import { useState, type FormEvent } from "react";
import { Icon, LINK_ICONS } from "../ui/Icon";
import { CoverArt } from "../ui/Art";
import { startsIn } from "../../lib/dates";
import { ImageField } from "../media/ImageField";
import { IMAGE_SIZES } from "../../lib/upload";
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

/** Tap-to-fill ideas; any category can still be typed. */
const CATEGORY_IDEAS = ["Music", "Talks", "Sports", "Party", "Workshop", "Community"];

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
    // Kept for the data model only; the server fills its default. The UI never shows it.
    emoji: event?.emoji ?? "",
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

  const startIso = toIso(form.startsAt);
  const endIso = toIso(form.endsAt);

  /** Sets the end a fixed number of hours after the start. */
  function lasts(hours: number) {
    if (!form.startsAt) return;
    setForm((f) => ({ ...f, endsAt: toLocalInput(new Date(new Date(f.startsAt).getTime() + hours * 3_600_000).toISOString()) }));
  }
  const duration = startIso && endIso ? Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000) : null;

  function quickLink(kind: EventLinkKind) {
    const label = KINDS.find((k) => k.id === kind)!.label;
    const blank = links.findIndex((l) => !l.url.trim() && !l.label.trim());
    if (blank >= 0) setLink(blank, { kind, label });
    else setLinks([...links, { label, url: "", kind }]);
  }

  const firstLink = links.find((l) => l.url.trim());

  return (
    <form className="editor ed" onSubmit={submit}>
      <div className="ed-steps">
        <fieldset className="ed-step">
          <legend>
            <span className="ed-n">1</span> What is it?
          </legend>
          <label>
            Title
            <input value={form.title} onChange={set("title")} required minLength={3} maxLength={120} autoFocus placeholder="Opening Night" />
          </label>
          <label>
            Category
            <input value={form.category} onChange={set("category")} required maxLength={40} placeholder="Music, Talks, Sports" />
          </label>
          <div className="ed-chips" aria-label="Category ideas">
            {CATEGORY_IDEAS.map((c) => (
              <button type="button" key={c} className={`ui-chip${form.category === c ? " is-selected" : ""}`} onClick={() => setForm((f) => ({ ...f, category: c }))}>
                {c}
              </button>
            ))}
          </div>
          <label>
            <span>
              Description <span className="ed-opt">optional</span>
            </span>
            <textarea value={form.description} onChange={set("description")} rows={3} maxLength={2000} placeholder="What happens, who it is for, anything people should bring." />
          </label>
        </fieldset>

        <fieldset className="ed-step">
          <legend>
            <span className="ed-n">2</span> When and where?
          </legend>
          <div className="ed-row">
            <label>
              Starts
              <input type="datetime-local" value={form.startsAt} onChange={set("startsAt")} required />
            </label>
            <label>
              Ends
              <input type="datetime-local" value={form.endsAt} onChange={set("endsAt")} required min={form.startsAt} />
            </label>
          </div>
          <div className="ed-chips" aria-label="How long it lasts">
            {[1, 2, 3, 4, 6].map((h) => (
              <button type="button" key={h} className={`ui-chip${duration === h ? " is-selected" : ""}`} onClick={() => lasts(h)} disabled={!form.startsAt}>
                {h} hour{h === 1 ? "" : "s"}
              </button>
            ))}
            <button type="button" className={`ui-chip${duration === 24 ? " is-selected" : ""}`} onClick={() => lasts(24)} disabled={!form.startsAt}>
              All day
            </button>
          </div>
          <div className="ed-row">
            <label>
              <span>
                Venue <span className="ed-opt">optional</span>
              </span>
              <input value={form.venue} onChange={set("venue")} maxLength={120} placeholder="The Terrace, 14 Kampala Road" />
            </label>
            <label>
              <span>
                Organiser <span className="ed-opt">optional</span>
              </span>
              <input value={form.organizer} onChange={set("organizer")} maxLength={80} />
            </label>
          </div>
        </fieldset>

        <fieldset className="ed-step">
          <legend>
            <span className="ed-n">3</span> Poster <span className="ed-opt">optional</span>
          </legend>
          <ImageField label="Poster image" maxSide={IMAGE_SIZES.poster} value={form.coverUrl} onChange={(coverUrl) => setForm((f) => ({ ...f, coverUrl }))} placeholder="Upload, or paste a link (jpg, png or webp)" />
          {form.coverUrl ? (
            <label>
              Describe the poster
              <input value={form.coverAlt} onChange={set("coverAlt")} placeholder="For people using screen readers" maxLength={160} />
            </label>
          ) : (
            <p className="ed-hint">No poster? The event gets a colour tile with an icon for its category.</p>
          )}
        </fieldset>

        <fieldset className="ed-step">
          <legend>
            <span className="ed-n">4</span> Buttons people need
          </legend>
          <p className="ed-hint">The first button is the big yellow one on the event page. Use the arrow to move a button up.</p>
          <div className="ed-chips" aria-label="Add a button">
            {KINDS.filter((k) => k.id !== "other").map((k) => (
              <button type="button" key={k.id} className="ui-chip" onClick={() => quickLink(k.id)} disabled={links.length >= 12}>
                <Icon name="plus" size={14} /> {k.label}
              </button>
            ))}
          </div>
          <div className="ed-links">
            {links.map((l, i) => (
              <div className={`ed-link${i === 0 ? " is-main" : ""}`} key={i}>
                <span className="ed-link-icon" aria-hidden="true">
                  <Icon name={LINK_ICONS[l.kind]} size={18} />
                </span>
                <input placeholder="Label" value={l.label} onChange={(e) => setLink(i, { label: e.target.value })} aria-label="Button label" maxLength={40} />
                <select value={l.kind} onChange={(e) => setLink(i, { kind: e.target.value as EventLinkKind })} aria-label="Button type">
                  {KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
                <input type="url" placeholder="https://" value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} aria-label="Button link" />
                <span className="ed-link-tools">
                  <button type="button" className="icon-btn" disabled={i === 0} onClick={() => setLinks(move(links, i, -1))} aria-label="Move button up">
                    <Icon name="up" size={16} />
                  </button>
                  <button type="button" className="icon-btn" onClick={() => setLinks(links.filter((_, j) => j !== i))} aria-label="Remove button">
                    <Icon name="close" size={16} />
                  </button>
                </span>
              </div>
            ))}
            {links.length === 0 && <p className="ed-hint">No buttons yet. Add tickets or a sign-up link above.</p>}
          </div>
        </fieldset>
      </div>

      <aside className="ed-preview" aria-label="How it will look">
        <p className="ed-preview-label">On your page</p>
        <div className="ed-preview-row">
          <span className="ed-preview-date">
            <b>{startIso ? new Date(startIso).toLocaleDateString(undefined, { day: "numeric" }) : "--"}</b>
            <span>{startIso ? new Date(startIso).toLocaleDateString(undefined, { month: "short" }) : "Date"}</span>
          </span>
          <CoverArt src={form.coverUrl || null} name={form.title || "New event"} category={form.category} size={48} />
          <span className="ed-preview-text">
            <b>{form.title || "Your event title"}</b>
            <span>{form.venue || form.category || "Venue"}</span>
          </span>
        </div>
        <p className="ed-preview-status">{startIso && endIso ? startsIn(startIso, endIso) : "Pick a start time to see the countdown"}</p>
        {firstLink && (
          <span className="ed-preview-btn">
            <Icon name={LINK_ICONS[firstLink.kind]} size={16} />
            {firstLink.label || "Link"}
          </span>
        )}
      </aside>

      {error && (
        <p className="form-error ed-error" role="alert">
          {error}
        </p>
      )}
      <div className="editor-actions ed-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : event ? "Save changes" : "Add event"}
        </button>
      </div>
    </form>
  );
}

/** Swaps a row with its neighbour. */
function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const next = [...list];
  const j = i + dir;
  if (j < 0 || j >= next.length) return list;
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}
