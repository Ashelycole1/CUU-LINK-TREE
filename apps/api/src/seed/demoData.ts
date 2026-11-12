import type { CreateEventInput, UpdateProfileInput } from "@event-tree/core";

/**
 * Sample hosts for local development and demos. Event dates are given as
 * day offsets from today so the demo always has both upcoming and past
 * events. Poster files live in apps/static/assets and are served by the API.
 * Links point at example.com (reserved for documentation).
 */
export interface DemoEvent extends Omit<CreateEventInput, "startsAt" | "endsAt" | "coverImage"> {
  /** Days from today, and local start hour. */
  day: number;
  startHour: number;
  hours: number;
  poster?: string;
  reviews?: { authorName: string; rating: number; comment?: string }[];
}

export interface DemoHost {
  username: string;
  displayName: string;
  profile: UpdateProfileInput;
  events: DemoEvent[];
}

export const DEMO_PASSWORD = "demo-password";
export const demoEmail = (username: string) => `${username}@demo.eventtree.test`;

export const DEMO_HOSTS: DemoHost[] = [
  {
    username: "buildersmeetup",
    displayName: "Builders Meetup",
    profile: {
      bio: "Monthly talks, hack weekends and career nights for people who make software.",
      heroImageUrl: "assets/hero.jpg",
      socials: [
        { platform: "x", url: "https://example.com/x/buildersmeetup" },
        { platform: "linkedin", url: "https://example.com/linkedin/buildersmeetup" },
        { platform: "website", url: "https://example.com/buildersmeetup" },
      ],
      appearance: { themeId: "stage-blue" },
    },
    events: [
      {
        title: "Build Day: AI and the Web",
        category: "Talks",
        emoji: "🚀",
        organizer: "Builders Meetup",
        venue: "Main Hall",
        description: "Six short talks and two hands-on workshops on shipping AI features in web apps. Bring a laptop.",
        day: 8, startHour: 10, hours: 6, poster: "assets/devfest-on-campus.jpg",
        links: [
          { label: "Register", url: "https://example.com/register/build-day", kind: "register", primary: true },
          { label: "Agenda", url: "https://example.com/agenda/build-day", kind: "agenda" },
        ],
      },
      {
        title: "48-Hour Hack Weekend",
        category: "Hackathon",
        emoji: "💻",
        organizer: "Builders Meetup",
        venue: "Innovation Lab",
        description: "Form a team, pick a track, build something real in 48 hours. Food and coffee provided.",
        day: 22, startHour: 9, hours: 48, poster: "assets/hackathon-48h.jpg",
        links: [
          { label: "Register a team", url: "https://example.com/register/hack-weekend", kind: "register", primary: true },
          { label: "Rules and tracks", url: "https://example.com/rules/hack-weekend", kind: "agenda" },
        ],
      },
      {
        title: "Careers in Tech Night",
        category: "Careers",
        emoji: "💼",
        organizer: "Builders Meetup",
        venue: "Atrium",
        description: "Meet hiring teams from twelve local companies. Short portfolio reviews from 6pm.",
        day: 14, startHour: 17, hours: 3, poster: "assets/career-fair.jpg",
        links: [{ label: "RSVP", url: "https://example.com/rsvp/careers-night", kind: "register", primary: true }],
      },
      {
        title: "Cloud Study Jam",
        category: "Workshops",
        emoji: "☁️",
        organizer: "Builders Meetup",
        venue: "Lab 3",
        description: "A guided afternoon of cloud labs, from first deploy to autoscaling.",
        day: -33, startHour: 14, hours: 3, poster: "assets/cloud-study-jam.jpg",
        links: [
          { label: "Slides", url: "https://example.com/slides/cloud-jam", kind: "slides", primary: true },
          { label: "Recording", url: "https://example.com/recording/cloud-jam", kind: "recording" },
        ],
        reviews: [
          { authorName: "Sample: Grace N.", rating: 5, comment: "The labs were well paced. I deployed my first service." },
          { authorName: "Sample: Daniel K.", rating: 4, comment: "Great content, the room was a bit warm." },
        ],
      },
    ],
  },
  {
    username: "nightandsong",
    displayName: "Night & Song",
    profile: {
      bio: "Live music, choirs and late-night culture. Every show, every set list, every photo.",
      socials: [
        { platform: "instagram", url: "https://example.com/instagram/nightandsong" },
        { platform: "youtube", url: "https://example.com/youtube/nightandsong" },
      ],
      appearance: { themeId: "aubergine" },
    },
    events: [
      {
        title: "Carols & Culture Night",
        category: "Music",
        emoji: "🎶",
        organizer: "Night & Song",
        venue: "Open Grounds",
        description: "Choirs, a string quartet and food stalls under the lights. Free entry with a ticket.",
        day: 29, startHour: 18, hours: 4, poster: "assets/christmas-carols.jpg",
        links: [{ label: "Get a free ticket", url: "https://example.com/tickets/carols", kind: "tickets", primary: true }],
      },
      {
        title: "Science After Dark",
        category: "Talks",
        emoji: "🔬",
        organizer: "Night & Song",
        venue: "Library Auditorium",
        description: "Short talks from researchers, a poster walk and a late bar.",
        day: -9, startHour: 18, hours: 4, poster: "assets/research-week.jpg",
        links: [{ label: "Photos", url: "https://example.com/photos/science-after-dark", kind: "photos", primary: true }],
        reviews: [{ authorName: "Sample: Faith A.", rating: 5, comment: "Packed room and brilliant speakers." }],
      },
      {
        title: "Newcomers Welcome Mixer",
        category: "Social",
        emoji: "👋",
        organizer: "Night & Song",
        venue: "Courtyard",
        description: "Meet the team, hear what's coming this season, and pick up a programme.",
        day: -70, startHour: 16, hours: 3, poster: "assets/orientation.jpg",
        links: [{ label: "Season programme", url: "https://example.com/programme", kind: "agenda", primary: true }],
      },
    ],
  },
  {
    username: "sunrisesports",
    displayName: "Sunrise Sports Club",
    profile: {
      bio: "Five-a-side, fun runs and finals days. Come play, come watch.",
      socials: [{ platform: "whatsapp", url: "https://example.com/whatsapp/sunrisesports" }],
      appearance: { themeId: "wristband" },
    },
    events: [
      {
        title: "Community Fun Run",
        category: "Running",
        emoji: "🏃",
        organizer: "Sunrise Sports Club",
        venue: "Riverside Park",
        description: "5 km and 10 km routes, all paces welcome. Medals for every finisher.",
        day: 5, startHour: 7, hours: 3,
        links: [{ label: "Sign up", url: "https://example.com/signup/fun-run", kind: "register", primary: true }],
      },
      {
        title: "Five-a-side League Finals",
        category: "Football",
        emoji: "⚽",
        organizer: "Sunrise Sports Club",
        venue: "Sports Ground",
        description: "Eight teams, one trophy. Results and photos from finals day.",
        day: -20, startHour: 8, hours: 10, poster: "assets/inter-faculty-games.jpg",
        links: [
          { label: "Results", url: "https://example.com/results/finals", kind: "other", primary: true },
          { label: "Photos", url: "https://example.com/photos/finals", kind: "photos" },
        ],
        reviews: [{ authorName: "Sample: Brian O.", rating: 4, comment: "Great final, the shade tents helped." }],
      },
    ],
  },
];
