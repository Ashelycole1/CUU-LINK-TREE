import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import {
  ApiError,
  type FontChoice,
  type ProfileDTO,
  type SocialLinkDTO,
  type SocialPlatform,
  type ThemePreset,
  type UpdateProfileInput,
} from "@event-tree/api-client";
import { api } from "../../lib/api";
import { ImageField } from "../../components/media/ImageField";
import { IMAGE_SIZES } from "../../lib/upload";
import { useResource } from "../../lib/useResource";
import { FONT_LABELS, FONT_STACKS } from "../../theme/appearance";
import { useAdmin } from "./AdminLayout";
import { CoverArt, Icon } from "../../components/ui";
import { SocialIcon } from "../../components/tree/SocialIcon";
import { headerTint } from "../../lib/dates";
import { posthog } from "../../lib/posthog";

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
      posthog.capture("profile_updated", { theme_id: updated.appearance.themeId, social_link_count: updated.socials.length });
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
  const cover = draft.heroImageUrl && draft.avatarUrl ? draft.heroImageUrl : "";
  const photo = draft.avatarUrl || draft.heroImageUrl;
  const presets = themes.data ?? [];

  return (
    <form className="appearance-admin ap" onSubmit={save}>
      <div className="admin-heading">
        <h1>Appearance</h1>
        <p>Your page colour and font set the mood. Everything else stays clean and readable.</p>
      </div>

      {/* Live header: changes show here straight away, before saving. */}
      <div
        className={`ap-preview${cover ? " has-cover" : ""}`}
        style={{ "--host-tint": headerTint(look.colors.background), "--host-font": FONT_STACKS[look.font], "--host-cover": cover ? `url(${JSON.stringify(cover)})` : undefined } as CSSProperties}
        aria-label="Preview of your page header"
      >
        <CoverArt src={photo} name={draft.displayName || "?"} icon="users" size={96} />
        <div className="ap-preview-text">
          <span>Event page</span>
          <b>{draft.displayName || "Your page"}</b>
          {draft.bio && <p>{draft.bio}</p>}
        </div>
      </div>

      <section className="ap-section" aria-labelledby="ap-profile">
        <div className="ap-section-head">
          <h2 id="ap-profile">Profile</h2>
          <p>The name and picture at the top of your page.</p>
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
          <ImageField label="Profile image" maxSide={IMAGE_SIZES.avatar} value={draft.avatarUrl} onChange={(avatarUrl) => patch({ avatarUrl })} placeholder="Upload, or paste a link" />
          <ImageField label="Header image" maxSide={IMAGE_SIZES.header} value={draft.heroImageUrl} onChange={(heroImageUrl) => patch({ heroImageUrl })} placeholder="Fills the background of your page header" />
        </div>
      </section>

      <section className="ap-section" aria-labelledby="ap-colour">
        <div className="ap-section-head">
          <h2 id="ap-colour">Page colour</h2>
          <p>Tints the top of your page and every event page.</p>
        </div>
        <div className="ap-swatches" role="radiogroup" aria-label="Page colour">
          {presets.map((t) => (
            <button
              type="button"
              key={t.id}
              role="radio"
              aria-checked={look.themeId === t.id}
              className={`ap-swatch${look.themeId === t.id ? " is-selected" : ""}`}
              onClick={() => applyTheme(t)}
            >
              <span className="ap-swatch-chip" style={{ background: t.colors.background }} aria-hidden="true">
                {look.themeId === t.id && <Icon name="check" size={18} />}
              </span>
              <span>{t.name}</span>
            </button>
          ))}
          <label className={`ap-swatch ap-swatch--custom${look.themeId === "custom" ? " is-selected" : ""}`}>
            <span className="ap-swatch-chip" style={{ background: look.colors.background }}>
              <input
                type="color"
                value={look.colors.background}
                onChange={(e) => patchLook({ themeId: "custom", colors: { ...look.colors, background: e.target.value } })}
                aria-label="Pick your own colour"
              />
              <Icon name="palette" size={18} />
            </span>
            <span>Your own</span>
          </label>
        </div>
        {!themes.data && <p className="muted">Loading colours…</p>}
      </section>

      <section className="ap-section" aria-labelledby="ap-font">
        <div className="ap-section-head">
          <h2 id="ap-font">Title font</h2>
          <p>Used for your page name and event titles.</p>
        </div>
        <div className="ap-fonts" role="radiogroup" aria-label="Title font">
          {(Object.keys(FONT_LABELS) as FontChoice[]).map((f) => (
            <button
              type="button"
              key={f}
              role="radio"
              aria-checked={look.font === f}
              className={`ap-font${look.font === f ? " is-selected" : ""}`}
              onClick={() => patchLook({ font: f })}
            >
              <span className="ap-font-sample" style={{ fontFamily: FONT_STACKS[f] }}>
                {draft.displayName || "Rooftop Sessions"}
              </span>
              <span className="ap-font-name">{FONT_LABELS[f]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="ap-section" aria-labelledby="ap-social">
        <div className="ap-section-head">
          <h2 id="ap-social">Social links</h2>
          <p>Shown as icons next to the play button. Leave a box empty to hide it.</p>
        </div>
        <div className="ap-socials">
          {PLATFORMS.map((p) => (
            <label key={p.id} className="ap-social">
              <span className="ap-social-icon" aria-hidden="true">
                <SocialIcon platform={p.id} />
              </span>
              <span className="sr-only">{p.label}</span>
              <input
                type={p.id === "whatsapp" ? "text" : "url"}
                value={draft.socials.find((s) => s.platform === p.id)?.url ?? ""}
                onChange={(e) => setSocial(p.id, e.target.value)}
                placeholder={`${p.label} link`}
              />
            </label>
          ))}
        </div>
      </section>

      <div className={`save-bar ap-save${saved ? "" : " is-dirty"}`}>
        <span role="status" aria-live="polite">
          {status || (saved ? "All changes saved" : "You have unsaved changes")}
        </span>
        <button type="button" className="btn btn-ghost" disabled={saved || busy} onClick={() => profile.data && setDraft(draftOf(profile.data))}>
          Discard
        </button>
        <button className="btn btn-primary" disabled={saved || busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
