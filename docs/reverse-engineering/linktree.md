# Reverse engineering Linktree for Event Tree

How Linktree's public profile page works, and which parts Event Tree copies, changes or leaves out.
The tool used was [REA (Reverse Engineer Anything)](https://github.com/morluto/rea).

## Method

1. **Capture.** Downloaded the public profile `https://linktr.ee/linktree` (86 KB of HTML) and the 40 JavaScript
   chunks it loads from `assets.production.linktr.ee/profiles/_next/static/chunks/` (2.8 MB).
2. **Read the page data.** The page is a Next.js app. Its server-rendered state sits in
   `<script id="__NEXT_DATA__">`, so the data model can be read directly from `props.pageProps`.
3. **Narrow the bundle.** A grep for link and event fields (`scheduleStart`, `tourEvents`, `CLUBHOUSE_EVENT`,
   `linkBackground`) cut the 40 chunks down to the 3 that render links and profiles
   (`_app`, `38840-…`, `55501-…`, 924 KB).
4. **Static analysis with REA.**
   ```bash
   # REA needs Node 22+; this runs it with a portable Node 24 runtime
   npx -y -p node@24 -p rea-agents@latest -- rea analyze-javascript-application ./subset --json
   ```
   REA parsed the code as inert text and never executed it. It parsed 3 files, 355 webpack modules and
   221,854 AST nodes, with 2,175 findings and no parse failures. It recovered 1,230 module nodes,
   185 chunks, 20 endpoint candidates and 6 storage operations. Its own limitations note says coverage is
   **partial**: REA reports anything outside the three chunks as unknown, not absent.

The first REA run, over all 40 chunks, timed out. Narrowing the input first is the workflow REA's
JavaScript guide recommends.

## What the page data shows

`pageProps` has about 70 keys. These are the ones that matter for an event tree:

| Linktree field | Meaning | Event Tree equivalent |
|---|---|---|
| `account.pageTitle`, `description`, `profilePictureUrl` | Profile header | `Profile.name`, `bio`, `avatarUrl` |
| `account.socialLinks`, `socialLinksPosition` | Social icon row | `Profile.socials` |
| `theme.colors` (`body`, `linkText`, `linkBackground`, `linkShadow`) | Page theme tokens | `Profile.theme` (`background`, `card`, `cardText`, `accent`) |
| `links[]` | The buttons | `Event` (each event is a "link" on the tree) |
| `links[].type` (`CLASSIC`, `HEADER`, `VIDEO`, `FORM`, `MUSIC`, `COMMERCE_PRODUCT`, `CALENDLY`, `CLUBHOUSE_EVENT`) | Polymorphic link kind | `EventLink.kind` (`register`, `slides`, `photos`, `recording`…) |
| `links[].position` | Manual ordering | `Event.position` (tie-breaker after start time) |
| `links[].thumbnail`, `modifiers.thumbnailUrl` | Image on the button | `Event.coverImage` (`ImageLink`) |
| `links[].scheduleStart`, `scheduleCountdown` | Show a link from a date, with a countdown | `Event.startsAt` / `endsAt`; status is derived, never stored |
| `tourEvents[]`, `pinnedLinks[]` | Event listings and pinned items | Upcoming list and "Next up" cards |
| `links[].rules.gate` (age, passcode, sensitive content) | Access gates | Not copied (out of scope) |
| `statsigInitValues`, ad, affiliate and commerce fields | Experiments and monetisation | Not copied |

A sample link record, trimmed:

```json
{ "id": "589138106", "title": "Linktree's Linktree", "type": "CLASSIC", "position": 0,
  "url": "https://linktr.ee/linktr.ee", "thumbnail": "https://ugc.production.linktr.ee/…jpeg",
  "scheduleStart": null, "scheduleCountdown": null, "rules": { "gate": { … } } }
```

## What REA found in the bundle

| Finding | Evidence | What Event Tree takes from it |
|---|---|---|
| Versioned REST API | Endpoint candidates `/v1/auth/me`, `/v1/auth/logout`, `/v1/auth/logoutall`, `/v1/auth/me/tenants`, `/v1/auth/tenant/select` | The API is versioned too (`/api/v1/...`) |
| GraphQL for forms | Operations `SubmitV2Form`, `getFormSubmissionSummaryPublic` | Visitor-submitted content plus a public summary: Event Tree's **reviews** and **rating summary** |
| Session state | `sessionStorage.getItem/setItem/removeItem` around `follower_return_path` | The web app keeps transient state (the last tab you had open) client-side only |
| Error and rate-limit handling | `retry-after` and `cf-ray` header reads | The API client surfaces `Retry-After` on 429 responses |
| Image CDN | A template literal building `https://d3oya…` URLs | Images are stored as **links**, not uploads, so any CDN or host works |

## Decisions for Event Tree

- **Keep:** a single scrolling profile, a theme driven by tokens, one record type for every button
  (here, events), ordering by position, scheduled visibility (events move to Past by themselves), and a
  public summary of visitor submissions.
- **Change:** Linktree's polymorphic `type` becomes a typed `EventLink.kind`. Thumbnails become a cover
  image plus a gallery of `ImageLink`s. Form submissions become star reviews.
- **Leave out:** access gates, commerce, affiliate links, analytics pixels and experiment flags.
- **Layout measurements** (40px corner buttons, 24px name, 48px tab switch, 14px gutters) were measured
  from the live page earlier and still live in `apps/static/styles.css`. The web app reuses them.

## Reproducing

All captures were kept outside the repo, so no Linktree code is committed. To redo the analysis,
follow the steps under Method above. Use REA's `--source-path` flag to analyze single files when the
full bundle is too large.
