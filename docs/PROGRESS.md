# Progress log

A running record of how Event Tree was built: one module at a time, each in its own commit.
Newest entries are at the bottom.

| # | Module | What was done | Status |
|---|--------|---------------|--------|
| 0 | Research | Cloned [morluto/rea](https://github.com/morluto/rea), read its JavaScript/web analysis workflow, captured a public Linktree profile (`linktr.ee/linktree`) and its 40 Next.js chunks, and extracted the page data model. Findings: [`reverse-engineering/linktree.md`](reverse-engineering/linktree.md). | Done |
| 1 | Repo root | npm workspaces (`apps/*`, `packages/*`), shared `tsconfig.base.json`, `.gitignore`, launch configs. Moved the original zero-build page to `apps/static/`. | Done |
| 2 | `packages/core` | Domain layer in plain TypeScript: `Event` aggregate, `ImageLink` / `EventLink` / `Rating` value objects, `Review` entity, `Profile`, repository interfaces, `EventService` / `ReviewService`, in-memory adapters, typed errors. Rules: an event's status comes from the clock; reviews open once an event starts; image links must be http(s). 12 tests pass (`vitest`), `tsc` clean. | Done |
| 3 | `apps/api` | Express REST API at `/api/v1`. `Controller` base class plus `EventController`, `ReviewController` and `ProfileController`. A `Container` composition root, `JsonFileStore` (atomic, serialised writes) and JSON repositories behind the core interfaces. Optional `ADMIN_KEY` guard on writes. A seed script reads `apps/static/events.js` so sample data has one source. 7 HTTP tests pass; seeded and queried live (8 events, 4 upcoming / 4 past, posters served from `/assets`). | Done |
| 4 | `packages/api-client` | `HttpTransport` (JSON, timeouts, admin key, error bodies) under `EventTreeClient` (typed method per endpoint). `ApiError` carries status, code, field and `Retry-After`. `Format` holds date, countdown, star and link-icon helpers shared by web and mobile. 6 tests pass, `tsc` clean. | Done |
| 5 | `apps/web` | React 18 + Vite 5 + React Router. Pages: `TreePage` (profile, Next up cards with live countdowns, Upcoming/Past switch, search and category chips, event buttons), `EventPage` (cover, links, photo gallery with lightbox, add-a-photo-by-link, rating bars, review form and list, share), `NewEventPage` (`EventForm` with poster link and buttons). `ThemeProvider` applies the profile theme as CSS variables; `SessionStore` remembers the last tab. `tsc` + `vite build` pass (60 KB gzipped JS). The dev server and API proxy were checked over HTTP; no visual check, because the Chrome extension was not connected. | Done |
