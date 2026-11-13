import type { EventDTO, EventStatus, TreeDTO } from "@event-tree/api-client";

/**
 * An illustrative page for the landing screen. It is built in the browser,
 * not fetched, so the marketing page works on a fresh deployment with no
 * hosts yet, and never links to an account that does not exist.
 */
const DAY = 86_400_000;

function sampleEvent(
  i: number,
  title: string,
  emoji: string,
  venue: string,
  daysFromNow: number,
  rating?: { average: number; count: number },
): EventDTO {
  const start = new Date();
  start.setHours(19, 0, 0, 0);
  start.setTime(start.getTime() + daysFromNow * DAY);
  const status: EventStatus = daysFromNow < 0 ? "past" : "upcoming";
  const iso = start.toISOString();
  return {
    id: `sample-${i}`,
    ownerId: "sample",
    slug: `sample-${i}`,
    title,
    description: "",
    category: "Music",
    organizer: "",
    venue,
    emoji,
    startsAt: iso,
    endsAt: new Date(start.getTime() + 3 * 3_600_000).toISOString(),
    coverImage: null,
    gallery: [],
    links: [],
    position: i,
    hidden: false,
    createdAt: iso,
    updatedAt: iso,
    status,
    acceptsReviews: status === "past",
    rating: { count: rating?.count ?? 0, average: rating?.average ?? 0, distribution: [0, 0, 0, 0, rating?.count ?? 0] },
  };
}

export function samplePage(): TreeDTO {
  return {
    profile: {
      ownerId: "sample",
      username: "yourname",
      displayName: "Night & Song",
      bio: "Live music and late nights. Every show we're putting on, in one place.",
      avatarUrl: "",
      heroImageUrl: "",
      socials: [
        { platform: "instagram", url: "https://instagram.com" },
        { platform: "tiktok", url: "https://tiktok.com" },
        { platform: "website", url: "https://example.com" },
      ],
      appearance: {
        themeId: "aubergine",
        colors: { background: "#2a0f3d", text: "#fffaf2", card: "#fffaf2", cardText: "#2a0f3d", accent: "#ff3d7f" },
        buttonStyle: "ticket",
        font: "bricolage",
      },
    },
    upcoming: [
      sampleEvent(1, "Rooftop Sessions", "🎷", "The Terrace", 4),
      sampleEvent(2, "Open Mic Night", "🎤", "Basement Bar", 11),
      sampleEvent(3, "Summer Block Party", "🎉", "Market Square", 26),
    ],
    past: [
      sampleEvent(4, "Unplugged Vol. 3", "🎸", "The Hall", -9, { average: 4.8, count: 37 }),
      sampleEvent(5, "Spring Showcase", "🎹", "Town Theatre", -40, { average: 4.6, count: 52 }),
    ],
    categories: ["Music"],
  };
}
