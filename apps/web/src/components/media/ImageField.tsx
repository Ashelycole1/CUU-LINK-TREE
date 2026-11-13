import { useId, useRef, useState } from "react";
import { ApiError } from "@event-tree/api-client";
import { api } from "../../lib/api";
import { IMAGE_ACCEPT, imageProblem } from "../../lib/upload";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * An image for a host's page: upload a file (stored in Neon Object
 * Storage) or paste a link to one hosted elsewhere.
 */
export function ImageField({ label, value, onChange, placeholder = "https://…", className = "span-2" }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    const problem = imageProblem(file);
    setError(problem ?? "");
    if (problem) return;
    setBusy(true);
    try {
      onChange((await api.uploadImage(file, file.type)).url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload that image.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className={`image-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      <div className="image-field-row">
        <input id={id} type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        <button type="button" className="btn btn-ghost" onClick={() => input.current?.click()} disabled={busy} aria-describedby={error ? `${id}-error` : undefined}>
          {busy ? "Uploading…" : "Upload"}
        </button>
        <input ref={input} type="file" accept={IMAGE_ACCEPT} hidden onChange={(e) => void upload(e.target.files?.[0])} aria-label={`Upload ${label.toLowerCase()}`} />
      </div>
      {error && (
        <small id={`${id}-error`} className="form-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
