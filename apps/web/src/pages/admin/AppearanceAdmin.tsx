import { useEffect, useState, type FormEvent } from "react";
import {
  ApiError,
  type ButtonStyle,
  type FontChoice,
  type ProfileDTO,
  type SocialLinkDTO,
  type SocialPlatform,
  type ThemeColors,
  type ThemePreset,
  type UpdateProfileInput,
} from "@event-tree/api-client";
import { api } from "../../lib/api";
import { ImageField } from "../../components/media/ImageField";
import { useResource } from "../../lib/useResource";
import { FONT_LABELS, FONT_STACKS } from "../../theme/appearance";
import { useAdmin } from "./AdminLayout";

const BUTTON_STYLES: { id: ButtonStyle; label: string }[] = [
  { id: "ticket", label: "Ticket stub" },
  { id: "pill", label: "Pill" },
  { id: "outline", label: "Outline" },
  { id: "shadow", label: "Hard shadow" },
];

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
  { key: "card", label: "Buttons" },
  { key: "cardText", label: "Button text" },
  { key: "accent", label: "Accent" },
];

const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "website", label: "Website" },
];

type Draft = Pick<ProfileDTO, "displayName" | "bio" | "avatarUrl" | "heroImageUrl" | "socials" | "appearance">;

const draftOf = (p: ProfileDTO): Draft => ({
  displayName: p.displayName,
  bio: p.bio,
  avatarUrl: p.avatarUrl,
  heroImageUrl: p.heroImageUrl,
  socials: p.socials,
  appearance: p.appearance,
});

/** Profile, theme, buttons, font, colours and social links. */
export function AppearanceAdmin() {
  const { profile, refreshPreview } = useAdmin();
  const themes = useResource(() => api.getThemes(), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.data && !draft) setDraft(draftOf(profile.data));
  }, [profile.data, draft]);

  if (!draft) return <p className="muted">Loading your page settings…</p>;

  const saved = profile.data ? JSON.stringify(draftOf(profile.data)) === JSON.stringify(draft) : true;
  const patch = (p: Partial<Draft>) => setDraft({ ...draft, ...p });
  const patchLook = (p: Partial<Draft["appearance"]>) => patch({ appearance: { ...draft.appearance, ...p } });

  function applyTheme(t: ThemePreset) {
    patchLook({ themeId: t.id, colors: t.colors, buttonStyle: t.buttonStyle, font: t.font });
  }

  function setSocial(platform: SocialPlatform, url: string) {
    const rest = draft!.socials.filter((s) => s.platform !== platform);
    const next: SocialLinkDTO[] = url.trim() ? [...rest, { platform, url }] : rest;
    // Keep a stable order so the page doesn't reshuffle while typing.
    next.sort((a, b) => PLATFORMS.findIndex((p) => p.id === a.platform) - PLATFORMS.findIndex((p) => p.id === b.platform));
    patch({ socials: next });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const { colors, ...rest } = draft!.appearance;
      const input: UpdateProfileInput = {
        ...draft!,
        socials: draft!.socials.map((s) => ({ ...s, url: s.url.trim() })),
        // Sending colours tells the server the host customised them; for a
        // preset, send only its id so the server keeps the preset's colours.
        appearance: rest.themeId === "custom" ? { ...rest, colors } : rest,
      };
      const updated = await api.updateMyProfile(input);
      profile.set(updated);
      setDraft(draftOf(updated));
      setStatus("Saved. Your page is updated.");
      refreshPreview();
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : "Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const look = draft.appearance;

  return (
    <form className="appearance-admin" onSubmit={save}>
      <div className="admin-heading">
        <h1>Appearance</h1>
        <p>Pick a theme, then make it yours. Save to update your live page.</p>
      </div>

      <section className="panel">
        <h2 className="panel-title">Profile</h2>
        <div className="profile-edit">
          <div className="avatar-preview" aria-hidden="true">
            {draft.avatarUrl ? <img src={draft.avatarUrl} alt="" /> : (draft.displayName || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="editor-grid">
            <label className="span-2">
              Page title
              <input value={draft.displayName} onChange={(e) => patch({ displayName: e.target.value })} required maxLength={60} />
            </label>
            <label className="span-2">
              Bio
              <textarea value={draft.bio} onChange={(e) => patch({ bio: e.target.value })} rows={2} maxLength={160} />
              <small className="hint">{draft.bio.length}/160</small>
            </label>
            <ImageField label="Profile image" value={draft.avatarUrl} onChange={(avatarUrl) => patch({ avatarUrl })} placeholder="Upload, or paste a link" />
            <ImageField label="Header image" value={draft.heroImageUrl} onChange={(heroImageUrl) => patch({ heroImageUrl })} placeholder="Optional banner behind your name" />
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Themes</h2>
        {themes.data ? (
          <div className="theme-grid" role="radiogroup" aria-label="Theme">
            {themes.data.map((t) => (
              <button
                type="button"
                key={t.id}
                role="radio"
                aria-checked={look.themeId === t.id}
                className={`theme-swatch${look.themeId === t.id ? " is-selected" : ""}`}
                onClick={() => applyTheme(t)}
              >
                <span className="theme-sample" style={{ background: t.colors.background, fontFamily: FONT_STACKS[t.font] }}>
                  <span className={`sample-btn sample-btn--${t.buttonStyle}`} style={{ background: t.colors.card, color: t.colors.cardText, borderColor: t.colors.cardText }} />
                  <span className={`sample-btn sample-btn--${t.buttonStyle}`} style={{ background: t.colors.card, color: t.colors.cardText, borderColor: t.colors.cardText }} />
                  <span className="sample-dot" style={{ background: t.colors.accent }} />
                </span>
                <span className="theme-name">{t.name}</span>
              </button>
            ))}
            {look.themeId === "custom" && (
              <span className="theme-swatch is-selected is-custom">
                <span className="theme-sample" style={{ background: look.colors.background }} />
                <span className="theme-name">Custom</span>
              </span>
            )}
          </div>
        ) : (
          <p className="muted">Loading themes…</p>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">Buttons</h2>
        <div className="choice-row" role="radiogroup" aria-label="Button style">
          {BUTTON_STYLES.map((b) => (
            <button
              type="button"
              key={b.id}
              role="radio"
              aria-checked={look.buttonStyle === b.id}
              className={`choice${look.buttonStyle === b.id ? " is-selected" : ""}`}
              onClick={() => patchLook({ buttonStyle: b.id })}
            >
              <span className={`sample-btn sample-btn--${b.id}`} aria-hidden="true" />
              {b.label}
            </button>
          ))}
        </div>

        <h3 className="panel-sub">Font</h3>
        <div className="choice-row" role="radiogroup" aria-label="Font">
          {(Object.keys(FONT_LABELS) as FontChoice[]).map((f) => (
            <button
              type="button"
              key={f}
              role="radio"
              aria-checked={look.font === f}
              className={`choice${look.font === f ? " is-selected" : ""}`}
              onClick={() => patchLook({ font: f })}
              style={{ fontFamily: FONT_STACKS[f] }}
            >
              <span className="font-sample">Aa</span>
              {FONT_LABELS[f]}
            </button>
          ))}
        </div>

        <h3 className="panel-sub">Colours</h3>
        <div className="color-grid">
          {COLOR_FIELDS.map((c) => (
            <label key={c.key} className="color-field">
              <input
                type="color"
                value={look.colors[c.key]}
                onChange={(e) => patchLook({ themeId: "custom", colors: { ...look.colors, [c.key]: e.target.value } })}
              />
              <span>
                {c.label}
                <small>{look.colors[c.key]}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Social icons</h2>
        <p className="muted">Shown as small icons under your bio. Leave a box empty to hide it.</p>
        <div className="editor-grid">
          {PLATFORMS.map((p) => (
            <label key={p.id}>
              {p.label}
              <input
                type={p.id === "whatsapp" ? "text" : "url"}
                value={draft.socials.find((s) => s.platform === p.id)?.url ?? ""}
                onChange={(e) => setSocial(p.id, e.target.value)}
                placeholder={p.id === "whatsapp" ? "https://wa.me/…" : "https://…"}
              />
            </label>
          ))}
        </div>
      </section>

      <div className="save-bar">
        <span role="status" aria-live="polite">
          {status || (saved ? "All changes saved" : "You have unsaved changes")}
        </span>
        <button type="button" className="btn btn-ghost" disabled={saved || busy} onClick={() => profile.data && setDraft(draftOf(profile.data))}>
          Discard
        </button>
        <button className="btn btn-dark" disabled={saved || busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
