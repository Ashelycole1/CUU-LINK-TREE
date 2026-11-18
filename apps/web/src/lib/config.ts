/**
 * The public address people share, e.g. "eventlink.ashelycole.dev".
 * Set VITE_PUBLIC_URL to change it. It is only used for labels and prefixes,
 * so "localhost:5173" never shows in the UI during development; links still
 * open on the current origin.
 */
const configured = (import.meta.env.VITE_PUBLIC_URL as string | undefined)?.trim();
export const PUBLIC_HOST = (configured || "https://eventlink.ashelycole.dev").replace(/^https?:\/\//, "").replace(/\/+$/, "");
