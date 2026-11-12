# CUU Link Tree: Events

A Linktree-style page for Cavendish University Uganda events. It shows what's coming up, keeps an archive of past events, and puts every link in one place.

## What it does
- **Profile header.** Logo, name, tagline and social icons, laid out like a Linktree page, with a badge showing how many events are coming up.
- **Corner buttons.** The share button (top right) shares the whole page. The bell (top left) downloads one .ics file with every upcoming event.
- **Upcoming / Past switch.** An event moves to Past by itself once its end time passes, so you never have to move it.
- **"Next up" cards.** The next three events sit in a swipeable row, each with a live countdown. While an event is running its card says **Happening now**.
- **Event link buttons.** Each event is a rounded button with its date on the left. Tap it to see the details, the event's links (Register, Slides, Photos…) and the calendar buttons.
- **Share menu on every event.** The ⋮ button opens a sheet with Copy link, WhatsApp, X, Facebook, email and add-to-calendar.
- **Search and category filters** (Tech, Career, Sports…). The categories are read from your data.
- **A link for every event.** For example `yoursite/#hackathon-48h` opens that event directly, which is handy for WhatsApp groups.
- Works on phones and needs no build step.

## Add or update an event
Edit **`events.js`** only. Copy an existing block and change its fields:

```js
{
  id: "unique-slug",                      // used in the share link
  title: "Event name",
  emoji: "🎤",
  category: "Tech",                       // becomes a filter chip
  organizer: "GDG on Campus CUU",
  start: "2026-12-05T14:00:00+03:00",     // Kampala time
  end:   "2026-12-05T17:00:00+03:00",
  venue: "Main Hall",
  description: "One or two sentences.",
  image: "assets/poster.jpg",             // optional: poster shown on the "Next up" card
  links: [
    { label: "Register", url: "https://...", primary: true },
    { label: "Agenda",   url: "https://..." }
  ]
}
```

When an event is over, change its links to recap links (Photos, Slides, Recording) so they show up under **Past**.

⚠️ Every event marked `sample: true` is placeholder data with a "sample" tag. Replace those events before you share the page. Also fill in your real social links and `submitEventUrl` in `CUU_PROFILE`.

## Preview and deploy
- **Preview locally:** double-click `index.html`.
- **GitHub Pages:** push the repo, then go to Settings → Pages → Deploy from branch `main` / root.
- **Vercel or Netlify:** import the repo. It's plain static files, so there's nothing to configure.
