/* ============================================================
   CUU LINK TREE — EVENT DATA
   ------------------------------------------------------------
   This is the only file you need to edit to add or update events.

   • Events sort themselves. Once an event's end time passes it
     moves from "Upcoming" to "Past" automatically. You never
     have to move it yourself.
   • Times use Kampala time (+03:00). Format: "2026-12-05T14:00:00+03:00"
   • When an event is over, add recap links (photos, slides,
     recording) to its `links` list and they show up under "Past".
   • Every event below marked `sample: true` is PLACEHOLDER data.
     Delete or replace those before sharing the page.
   ============================================================ */

window.CUU_PROFILE = {
  name: "CUU Events",
  handle: "@cavendish.events",
  tagline: "Every event at Cavendish University Uganda: what's coming up, what you missed, and every link in one place.",
  avatarText: "CUU",          // shown if no avatar image is set
  avatar: "",                 // e.g. "assets/logo.png"
  submitEventUrl: "#",        // e.g. a Google Form for students to submit events
  socials: [
    { type: "instagram", url: "#" },
    { type: "x",         url: "#" },
    { type: "linkedin",  url: "#" },
    { type: "whatsapp",  url: "#" },
    { type: "youtube",   url: "#" },
    { type: "website",   url: "#" }
  ]
};

window.CUU_EVENTS = [
  {
    id: "devfest-on-campus",
    sample: true,
    title: "DevFest on Campus",
    emoji: "🚀",
    category: "Tech",
    organizer: "GDG on Campus CUU",
    start: "2026-11-21T10:00:00+03:00",
    end:   "2026-11-21T16:00:00+03:00",
    venue: "Main Hall, CUU",
    description: "A day of talks, workshops and demos on AI, cloud and web. Open to every student, whatever your course.",
    links: [
      { label: "Register", url: "#", primary: true },
      { label: "Agenda", url: "#" }
    ]
  },
  {
    id: "career-fair",
    sample: true,
    title: "End-of-Year Career Fair",
    emoji: "💼",
    category: "Career",
    organizer: "Career Services Office",
    start: "2026-11-27T09:00:00+03:00",
    end:   "2026-11-27T15:00:00+03:00",
    venue: "Student Centre",
    description: "Meet employers hiring for internships and graduate roles. Bring printed CVs.",
    links: [
      { label: "RSVP", url: "#", primary: true },
      { label: "Employer list", url: "#" }
    ]
  },
  {
    id: "hackathon-48h",
    sample: true,
    title: "48-Hour Campus Hackathon",
    emoji: "⚡",
    category: "Tech",
    organizer: "Faculty of Science & Technology",
    start: "2026-12-05T08:00:00+03:00",
    end:   "2026-12-07T08:00:00+03:00",
    venue: "Computer Labs, Block B",
    description: "Form a team of up to 4 and build something that solves a real problem for Ugandan students. Prizes for the top 3 teams.",
    links: [
      { label: "Register team", url: "#", primary: true },
      { label: "Rules & tracks", url: "#" },
      { label: "WhatsApp group", url: "#" }
    ]
  },
  {
    id: "christmas-carols",
    sample: true,
    title: "Carols & Culture Night",
    emoji: "🎄",
    category: "Social",
    organizer: "Guild Office",
    start: "2026-12-12T18:00:00+03:00",
    end:   "2026-12-12T22:00:00+03:00",
    venue: "Open Grounds",
    description: "End the semester with music, food and performances from student clubs.",
    links: [
      { label: "Get a free ticket", url: "#", primary: true }
    ]
  },
  {
    id: "research-week",
    sample: true,
    title: "Student Research Showcase",
    emoji: "🔬",
    category: "Academic",
    organizer: "Directorate of Research",
    start: "2026-11-04T09:00:00+03:00",
    end:   "2026-11-04T17:00:00+03:00",
    venue: "Library Auditorium",
    description: "Final-year students presented their research projects to staff and industry guests.",
    links: [
      { label: "Photos", url: "#", primary: true },
      { label: "Abstracts (PDF)", url: "#" }
    ]
  },
  {
    id: "inter-faculty-games",
    sample: true,
    title: "Inter-Faculty Games",
    emoji: "⚽",
    category: "Sports",
    organizer: "Sports Department",
    start: "2026-10-24T08:00:00+03:00",
    end:   "2026-10-24T18:00:00+03:00",
    venue: "Sports Ground",
    description: "Football, netball and athletics between faculties.",
    links: [
      { label: "Results", url: "#", primary: true },
      { label: "Photos", url: "#" }
    ]
  },
  {
    id: "cloud-study-jam",
    sample: true,
    title: "Cloud Study Jam",
    emoji: "☁️",
    category: "Tech",
    organizer: "GDG on Campus CUU",
    start: "2026-10-10T14:00:00+03:00",
    end:   "2026-10-10T17:00:00+03:00",
    venue: "Computer Lab 3",
    description: "A hands-on session on the basics of cloud computing, with free lab credits.",
    links: [
      { label: "Slides", url: "#", primary: true },
      { label: "Recording", url: "#" }
    ]
  },
  {
    id: "orientation",
    sample: true,
    title: "Freshers' Orientation Week",
    emoji: "🎓",
    category: "Academic",
    organizer: "Dean of Students",
    start: "2026-09-07T08:00:00+03:00",
    end:   "2026-09-11T17:00:00+03:00",
    venue: "Across campus",
    description: "Welcome week for new students: campus tours, club fair and registration help.",
    links: [
      { label: "Freshers' guide", url: "#", primary: true }
    ]
  }
];
