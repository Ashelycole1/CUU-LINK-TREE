/**
 * The fixed set of event categories. Hosts pick one when they list an event,
 * so the Community page can filter cleanly across every host.
 */
export const EVENT_CATEGORIES = [
  "Music",
  "Talks",
  "Tech",
  "Sports",
  "Party",
  "Workshop",
  "Community",
  "Arts",
  "Food",
  "Faith",
  "Other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/** Words that place free text in a category, checked in order. */
const MATCHERS: [EventCategory, RegExp][] = [
  ["Music", /music|concert|gig|band|dj|song|jazz|choir|festival|karaoke/],
  ["Tech", /tech|code|coding|dev|hack|software|startup|ai\b|data|build/],
  ["Talks", /talk|panel|conference|speak|lecture|seminar|summit|forum|meetup/],
  ["Sports", /sport|run|match|game|fitness|final|football|soccer|race|marathon|yoga|gym/],
  ["Party", /party|night|club|rave|celebrat|birthday/],
  ["Workshop", /workshop|class|training|course|bootcamp|lesson/],
  ["Arts", /art|film|cinema|theat|exhibit|gallery|dance|poetry|comedy|fashion|photo/],
  ["Food", /food|dinner|lunch|brunch|cook|tasting|wine|beer|coffee|market/],
  ["Faith", /church|faith|worship|prayer|mosque|fellowship|gospel|bible/],
  ["Community", /community|social|charity|volunteer|network|family|kids|school/],
];

/**
 * Any category text to one of EVENT_CATEGORIES: an exact name (any case)
 * keeps it, otherwise the first matching keyword wins, else "Other". Older
 * events with free-text categories are read through this, so no data
 * migration is needed.
 */
export function toCategory(raw: string | null | undefined): EventCategory {
  const text = String(raw ?? "").trim().toLowerCase();
  const exact = EVENT_CATEGORIES.find((c) => c.toLowerCase() === text);
  if (exact) return exact;
  for (const [category, pattern] of MATCHERS) if (pattern.test(text)) return category;
  return "Other";
}
