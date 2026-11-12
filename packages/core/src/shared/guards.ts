import { ValidationError } from "./errors";

/** Small validation helpers shared by entities and value objects. */
export const Guard = {
  text(value: unknown, field: string, opts: { min?: number; max: number }): string {
    if (typeof value !== "string") throw new ValidationError(`${field} must be text.`, field);
    const trimmed = value.trim();
    const min = opts.min ?? 0;
    if (trimmed.length < min) {
      throw new ValidationError(
        min <= 1 ? `${field} is required.` : `${field} must be at least ${min} characters.`,
        field,
      );
    }
    if (trimmed.length > opts.max) {
      throw new ValidationError(`${field} must be ${opts.max} characters or fewer.`, field);
    }
    return trimmed;
  },

  optionalText(value: unknown, field: string, max: number): string {
    if (value == null || value === "") return "";
    return Guard.text(value, field, { max });
  },

  httpUrl(value: unknown, field: string): string {
    if (typeof value !== "string" || value.trim() === "") {
      throw new ValidationError(`${field} is required.`, field);
    }
    let parsed: URL;
    try {
      parsed = new URL(value.trim());
    } catch {
      throw new ValidationError(`${field} must be a full link starting with http:// or https://.`, field);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new ValidationError(`${field} must start with http:// or https://.`, field);
    }
    return parsed.toString();
  },

  date(value: unknown, field: string): Date {
    const date = value instanceof Date ? new Date(value) : new Date(String(value ?? ""));
    if (Number.isNaN(date.getTime())) throw new ValidationError(`${field} must be a valid date and time.`, field);
    return date;
  },

  maxItems<T>(items: readonly T[], field: string, max: number): readonly T[] {
    if (items.length > max) throw new ValidationError(`${field} can hold at most ${max} items.`, field);
    return items;
  },
};

export function slugify(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "event"
  );
}
