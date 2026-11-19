# Flutter mobile app: build plan for Claude Code

> **Read this whole file before writing any Flutter code.** It is the spec for `apps/mobile_flutter/`,
> the Flutter replacement for the Expo app in `apps/mobile/`. When this file and your own habits
> disagree, follow this file. When it and the repo disagree (an endpoint, a field name), the repo
> wins. Fix this file in the same commit.

## Why this plan exists (context for Claude Code)

- **Why Flutter:** the Expo/React Native app (`apps/mobile/`, Expo SDK 52, RN 0.76) crashes often and is hard to work with.
  The owner chose Flutter because it is cleaner and lighter. Being clean and stable matters more than shipping features quickly.
- **What we give up:** Dart can't import the TypeScript packages (`packages/core`, `packages/api-client`).
  To avoid duplicated logic, **the API is the shared layer**. Business rules stay on the server (event status is already
  computed there), and the Flutter app is a thin client that mirrors `EventTreeClient.ts` and `dto.ts`.
- **What stays the same:** the React web app (`apps/web`), the Express API (`apps/api`), Neon Auth, Neon Postgres and the deploy setup.
- **Who uses it:** students at Cavendish University Uganda (mostly budget Android phones and mobile data) and the event hosts
  (clubs, the guild, faculties, GDG, AWS Student Builder Group, CUUCSA). Upcoming events and reminders come first.
  Past events (photos, slides, reviews) come second.
- **Constraints:** no Firebase access right now, and analytics must be free. Both are handled in §5 and §6.
- **Design direction from the owner:** a Spotify-style dark design with no emojis (icons instead). The current design looks "too AI-generated".
  Make it look designed by a person: real hierarchy, restraint, one accent color.

## Decisions at a glance

| Topic | Decision | Section |
|---|---|---|
| Mobile framework | Flutter (stable, pinned with FVM), in `apps/mobile_flutter/` next to Expo until parity | §0, §10 |
| Link to the web app | Same `/api/v1`, same Neon Auth accounts via `/api/auth`, same share URLs, same themes | §1 |
| State and routing | Riverpod + go_router | §2 |
| Notifications | Local scheduled reminders + background sync only. No server, no Firebase, no remote push | §5 |
| Analytics | PostHog free tier, one project shared by web and app | §6 |
| Stability | The "doesn't crash" rules are mandatory | §7 |
| AI tooling | The official Flutter plugin for Claude Code, Flutter rules in CLAUDE.md, the Dart MCP server, and the `evanca/flutter-ai-rules` and `mobile-app-ui-design` skills | §8 |

## 0. Goals and non-goals

**Goals**
1. A clean, light, **crash-resistant** Flutter app for Android first, with iOS second.
2. **Connected to the web app**: it uses the same API (`/api/v1`), the same accounts (Neon Auth through `/api/auth`),
   the same themes, and the same share URLs. A page or event made on the web shows up in the app, and the reverse.
3. Students can **find events, save them and get reminders** with **no Firebase**.
4. Product analytics with **PostHog** (free tier), shared with the web app.
5. A Spotify-style dark UI for the app's own screens. Use **icons, never emojis**, anywhere in the app's interface.

**Non-goals (for now)**
- Rewriting the API or the web app. The Flutter app adapts to them.
- Sharing code with TypeScript. The API is the contract.
- Deleting `apps/mobile/` (Expo). Keep it until the Flutter app reaches parity (§10, phase 6).

## 1. How it connects to the web app

```
                ┌───────────────────────────── same server ─────────────────────────────┐
apps/web  ───►  │ /api/auth/*  (Neon Auth proxy)     /api/v1/*  (Express)    /media/*   │
(React)         │                                                                        │
apps/mobile_flutter ──► same endpoints, same accounts, same data                         │
                └────────────────────────────────────────────────────────────────────────┘
```

- **Base URL** comes from `--dart-define=API_BASE_URL=...`. Prod uses the deployed origin (same as the web app).
  Local dev uses `http://10.0.2.2:<api port>` on the Android emulator, or the PC's LAN IP on a real phone.
  Read `apps/api/src/config.ts` for the port. Never hard-code URLs in widgets.
- **The source of truth for the API** is `packages/api-client/src/EventTreeClient.ts` (every endpoint)
  and `packages/core/src/dto.ts` (every JSON shape). Port these **1:1**, using the same method names and the same field names.
- **Status is computed by the server.** `EventDTO.status` is `upcoming | live | past`. Do **not** recompute it from dates
  in Dart, except for the countdown display. Re-fetch `getPage` to refresh it.
- **Auth** must copy `packages/api-client/src/NeonAuthSession.ts` exactly:
  - Every call to `<base>/api/auth/<path>` sends `x-auth-transport: session`, plus `x-auth-session: <stored session>` when signed in.
  - If a response has an `x-auth-session` header, save it (an empty value means signed out). Store it in `flutter_secure_storage`.
  - The flows are sign-up (`POST /sign-up/email`), verify (emailed OTP), sign-in (`POST /sign-in/email`) and sign-out.
  - Get the API JWT from `GET /api/auth/token`. Cache it and refresh it 60 s before it expires.
    Send it as `Authorization: Bearer <jwt>` on `/api/v1` calls.
  - After sign-in, call `GET /api/v1/auth/me`. If `user == null`, send them to the **Claim username** screen (`POST /auth/claim`).
  - Copy the friendly error messages from `NeonAuthSession.ts` (`friendlyAuthMessage`).
- **Share links and deep links**: shared URLs are the **web** URLs, so they work for people without the app.
  Read `apps/web` routes for the exact `/:username` and event path format, and use the same paths in `go_router`.
  Set up Android App Links for the production domain, so those links open in the app when it's installed.
- **Themes**: get them from `GET /themes`. A host's public page in the app renders their `AppearanceDTO`
  (colors, `buttonStyle`: ticket/pill/outline/shadow, font: bricolage/figtree/fraunces) **so it looks the same as on the web**.
  Bundle the three fonts as assets. Do not use runtime `google_fonts` downloads, because they fail offline.
- **Images**: use `ImageLinkDTO.url` / `UploadDTO.url` (absolute `/media/...`). Uploads are JPEG/PNG/GIF/WebP, up to 5 MB.
  Compress the image before uploading.

## 2. Tech choices (keep this list short: every plugin is a crash risk)

| Need | Package | Why |
|---|---|---|
| Flutter version | **FVM**, pinned stable (`.fvmrc`) | Everyone builds with the same SDK |
| State | `flutter_riverpod` (no generator) | Testable, no BuildContext plumbing |
| Navigation and deep links | `go_router` | URL-based, which matches the web routes |
| HTTP | `dio` | Interceptors for auth, timeouts and retries |
| Models | `freezed` + `json_serializable` | Immutable DTOs that mirror `dto.ts` |
| Secure storage | `flutter_secure_storage` | The Neon Auth session value |
| Local cache | `shared_preferences` (small), `hive_ce` *only if needed* | Saved events and the offline last-seen page |
| Images | `cached_network_image` | Caching, plus an `errorWidget` so nothing crashes |
| Image pick and compress | `image_picker`, `flutter_image_compress` | Uploads under 5 MB |
| Reminders | `flutter_local_notifications`, `timezone`, `flutter_timezone` | Free, works offline, no Firebase |
| Background sync | `workmanager` | Periodic check for new events (about every 15 min at best, decided by the OS) |
| Analytics | `posthog_flutter` | Free tier, official SDK |
| Icons | `lucide_icons_flutter` (or Material Symbols) | Replaces emojis |
| Share / open | `share_plus`, `url_launcher`, `add_2_calendar` | |
| Lints | `very_good_analysis` | Strict lints catch crashes early |
| Tests | `flutter_test`, `mocktail`, `integration_test` | |

Adding any package not in this table needs a line in `docs/PROGRESS.md` saying why. The package must support Android and iOS
and have a verified publisher.

## 3. Folder structure

The structure is feature-first, and each feature has three layers. UI talks only to providers, providers talk only to repositories,
and repositories talk only to the API client.

```
apps/mobile_flutter/
├── .fvmrc                         # pinned Flutter stable
├── pubspec.yaml / pubspec.lock    # lockfile is committed
├── analysis_options.yaml          # include: package:very_good_analysis/analysis_options.yaml
├── CLAUDE.md                      # short: "Follow ../../docs/flutter-mobile-plan.md" + Flutter rules.md
├── assets/
│   ├── fonts/                     # Bricolage Grotesque, Figtree, Fraunces (same as web)
│   └── images/                    # logo, empty-state art (no emojis)
├── android/ ios/                  # App Links / Universal Links, notification icons
├── lib/
│   ├── main.dart                  # calls bootstrap() only
│   ├── bootstrap.dart             # error zones, PostHog, notifications, timezone, workmanager init
│   ├── app.dart                   # MaterialApp.router + dark theme
│   ├── core/
│   │   ├── config/env.dart                    # API_BASE_URL, POSTHOG_KEY, POSTHOG_HOST via --dart-define
│   │   ├── util/
│   │   │   ├── format.dart                    # port of Format.ts: dates, times, countdown wording
│   │   │   └── links.dart                     # opening a URL, and the web URL to share
│   │   ├── network/
│   │   │   ├── dio_provider.dart              # timeouts 15 s, base URL + /api/v1
│   │   │   ├── auth_interceptor.dart          # adds Bearer JWT, one retry on 401 after a token refresh
│   │   │   └── api_error.dart                 # mirrors ApiError (status, code, message)
│   │   ├── auth/
│   │   │   ├── neon_auth_session.dart         # port of NeonAuthSession.ts
│   │   │   └── session_store.dart             # flutter_secure_storage
│   │   ├── analytics/
│   │   │   ├── analytics.dart                 # abstract Analytics { track, screen, identify, reset }
│   │   │   ├── posthog_analytics.dart
│   │   │   └── analytics_events.dart          # event-name constants shared with web (see §6)
│   │   ├── notifications/
│   │   │   ├── notification_service.dart      # abstract: requestPermission, scheduleReminder, cancel, showNow
│   │   │   ├── local_notification_service.dart
│   │   │   └── background_sync.dart           # workmanager task: fetch followed pages, notify on new events
│   │   ├── router/app_router.dart             # routes mirror the web URLs
│   │   ├── theme/
│   │   │   ├── tokens.dart                    # colors, spacing, radii, type scale
│   │   │   ├── app_theme.dart                 # Spotify-style dark ThemeData for app chrome
│   │   │   └── page_theme.dart                # AppearanceDTO → widget styles for a host's page
│   │   └── widgets/                           # shared, dumb widgets
│   │       ├── event_tile.dart                # ticket/pill/outline/shadow variants (a host's page)
│   │       ├── event_row.dart                 # the same event on the app's own dark screens
│   │       ├── status_badge.dart              # Live / This week / Past
│   │       ├── countdown.dart
│   │       ├── category_icon.dart             # category → icon (replaces EventDTO.emoji in the UI)
│   │       ├── async_view.dart                # loading / error+retry / empty for AsyncValue
│   │       └── safe_network_image.dart
│   ├── data/
│   │   ├── models/                            # freezed ports of dto.ts
│   │   │   ├── event.dart  profile.dart  tree.dart  review.dart
│   │   │   ├── me.dart  community.dart  analytics_summary.dart  theme_preset.dart
│   │   └── repositories/
│   │       ├── auth_repository.dart           # me, claim, checkUsername
│   │       ├── pages_repository.dart          # getThemes, getCommunity, getPage, listPageEvents, getPageEvent, recordView
│   │       ├── event_actions_repository.dart  # recordClick, reviews, ratings, addImage, uploadEventPhoto
│   │       ├── dashboard_repository.dart      # /me/* endpoints
│   │       └── saved_repository.dart          # local: saved events + followed usernames
│   └── features/
│       ├── shell/            # bottom nav: Discover · Saved · Dashboard (if host) · Profile
│       ├── auth/             # sign_in, sign_up, verify_email, claim_username
│       ├── discover/         # /community feed, search, category chips
│       ├── page/             # a host's public page (upcoming / past tabs), follow button
│       ├── event/            # event detail: links, countdown, add to calendar, share, reminders,
│       │                     #   reviews + rating (past/live), photo upload, gallery
│       ├── saved/            # saved events + upcoming reminders list
│       ├── dashboard/        # my events list, create/edit, hide toggle, reorder, appearance, analytics
│       └── settings/         # notifications on/off, analytics opt-out, sign out, about
│           # every feature folder:
│           #   presentation/   screens + widgets (no business logic)
│           #   application/    Riverpod providers / Notifiers
├── test/                      # mirrors lib/; repositories tested with mocked dio
└── integration_test/          # sign-in → open page → save event → reminder scheduled
```

Rules:
- `presentation/` never imports `dio`, repositories or `data/models` constructors directly. It goes through `application/` providers.
- A feature never imports another feature. Shared things move to `core/` or `data/`.
- One widget per file. Screens stay under about 250 lines. Split them into widgets.
- A feature's own widgets live in `presentation/widgets/`; only widgets two features need move to `core/widgets/`.
- `*.freezed.dart` and `*.g.dart` are generated, excluded from the analyzer and not committed.
  Run `dart run build_runner build` after changing anything in `data/models/`
  (`--delete-conflicting-outputs` was removed from build_runner and is no longer accepted).

## 4. Design system

- **App chrome** (nav, Discover, Saved, Dashboard, Settings) uses a **Spotify-style dark** look: background `#121212`,
  surfaces `#181818`/`#282828`, text `#FFFFFF` / muted `#B3B3B3`, one accent (pick from the web brand),
  rounded 8–12 px cards, big bold section headings, horizontal carousels for "This week" and "Popular hosts".
- **A host's public page** uses the host's own `AppearanceDTO`, like on the web. That is the only place theme colors appear.
- **No emojis in the UI.** `EventDTO.emoji` is legacy data, so show `category_icon.dart` instead
  (map from `packages/core/src/events/categories.ts`).
- Touch targets are at least 48 dp. Text supports system font scaling. Check contrast at least once with the accessibility scanner.
- Use the `mobile-app-ui-design` skill already in `.agents/skills/` for layout and convention decisions.
- Before you build the screens, make a design pass of 3 key screens (Discover, a host page, event detail) and get the user's approval.

## 5. Notifications (on-device only, no server)

Use **local scheduled notifications** and **background sync**. They're free, need no server, and work offline.
1. When a student **saves** an event, schedule reminders on the device: **1 day before** and **1 hour before** `startsAt`.
   Use `zonedSchedule` with `Africa/Kampala` as the fallback zone. Cancel and re-schedule if the event's time changes.
2. When a student **follows** a host, `background_sync.dart` (workmanager, periodic) calls `listPageEvents` for each
   followed username. It compares against the event IDs it saw last time and shows a local "New event from @host"
   notification for new ones. It also re-schedules reminders for saved events whose times changed.
3. The Android 13+ `POST_NOTIFICATIONS` permission is requested **when the user taps Save or Follow** for the first time, not on launch.
   Exact alarms are not required. Use inexact scheduling, so no `SCHEDULE_EXACT_ALARM` permission is needed.

**Decision: this is the only notification system.** There is no remote push, so no Firebase/FCM, no ntfy/UnifiedPush,
no APNs and no push server. Do not add push packages or API changes for push. Everything runs on the phone.

**What this means in practice:**
- Reminders for saved events always fire, even offline, on Android and iOS.
- "New event from @host" alerts depend on background sync, which the OS runs roughly every 15 minutes or less often
  (battery saver can delay it). That's acceptable. Also run the same sync when the app opens, so opening the app always catches up.
- Keep everything behind the `NotificationService` interface so the rest of the app never calls the plugin directly.

## 6. Analytics: PostHog

- Use `posthog_flutter` (and `posthog-js` in `apps/web`), with the **same project key** in both,
  so web and app usage show up in one place.
- **The free tier is enough:** product analytics includes **1M events per month free**, resets monthly and doesn't expire,
  with no credit card. Mobile session replay has a smaller free allowance (about 2.5K recordings a month), which is another reason it stays off.
  If usage ever nears the limit, cut noisy events first. Don't send an event per scroll or per countdown tick.
- Use the free tier. Turn **session replay off** to start, and turn it on later with text masking if needed.
- Call `identify(user.id)` after `me()` returns a user, and `reset()` on sign out. **Never send emails, names or review text** as properties.
- Add an opt-out toggle in Settings (`optOut()` / `optIn()`).
- Use the same event names on web and app. The list lives in two files that must stay in step:
  `apps/mobile_flutter/lib/core/analytics/analytics_events.dart` and `apps/web/src/lib/analyticsEvents.ts`.
  The core: `page_viewed`, `event_opened`, `event_link_clicked`, `event_saved`, `reminder_scheduled`, `host_followed`,
  `review_added`, `photo_uploaded`, `signed_up`, `username_claimed`, `event_created`, `event_updated`, plus `app_error`.
  Both apps also send `signed_in`, `email_verified`, `calendar_exported`, `profile_updated`,
  `event_visibility_changed` and `event_deleted`, which the web was already sending and the app now does too.
- The existing in-house view/click analytics (`/pages/:u/views`, `/events/:id/clicks`, the host dashboard) **stay**.
  PostHog is for *our* product decisions. The in-house analytics are what *hosts* see.
- Errors: wire `FlutterError.onError` and `PlatformDispatcher.instance.onError` in `bootstrap.dart` to `Analytics`
  (an `app_error` event with the type and a short message, no personal data). Use PostHog error tracking if the SDK version supports it.

## 7. "Doesn't crash" rules (Claude Code must follow all of them)

1. `bootstrap.dart` wraps `runApp` in `runZonedGuarded` and sets both global error handlers. Release builds show a friendly error widget
   (`ErrorWidget.builder`), never a red screen.
2. **Never use `!` on data from the network or storage.** Models use nullable fields or defaults, and `fromJson` tolerates missing keys.
3. Every async screen renders `AsyncValue` through `async_view.dart`, with loading, error plus **Retry**, and empty states.
4. Every network image goes through `safe_network_image.dart` (placeholder plus error fallback).
5. Every `dio` call has a 15 s timeout. Map errors to `ApiError` with friendly messages, as the TS client does.
6. Don't use `BuildContext` across async gaps without checking `mounted`. Dispose controllers. Don't start work in `build()`.
7. Run plugins' platform setup (permissions, manifest entries) exactly as their README says, then test on a **real low-end Android phone**,
   not only the emulator.
8. `flutter analyze` must show **0 issues**, and `flutter test` must pass before every commit.
9. Release builds use `flutter build apk --split-per-abi` (smaller downloads for students on mobile data). Enable R8/minify and
   keep rules for any plugin that needs them.
10. Pin versions in the lockfile, and upgrade one package at a time with a test run each time.

## 8. Claude Code setup (recommended skills, plugins and MCP)

Run these once, in this order:

```bash
# 1. Official Flutter + Dart plugin for Claude Code (skills + Dart MCP server)
claude plugin marketplace add flutter/agent-plugins
claude plugin install dart-flutter@dart-flutter

# 2. If you only want the MCP server (analyzer, tests, formatting, pub.dev search):
claude mcp add --transport stdio dart -- dart mcp-server

# 3. Community skills for Riverpod, Effective Dart, mocktail (install only the ones you use)
npx skills add https://github.com/evanca/flutter-ai-rules
```

- Plugins don't load Flutter's **rules** file automatically. Copy the official
  `rules.md` (https://raw.githubusercontent.com/flutter/flutter/refs/heads/main/docs/rules/rules.md)
  into `apps/mobile_flutter/CLAUDE.md` below the line that points to this plan.
- Keep using **`mobile-app-ui-design`** (already in `.agents/skills/`) for screen design.
- Use the Dart MCP server's analyzer and test tools **after every change**, not only at the end.

## 9. Environment and running

```bash
cd apps/mobile_flutter
fvm flutter pub get
fvm dart run build_runner build   # freezed/json models
fvm flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:<port> \
  --dart-define=POSTHOG_KEY=phc_xxx \
  --dart-define=POSTHOG_HOST=https://us.i.posthog.com          # or eu.i.posthog.com
```

- Start the API first (see the root `README.md`: seed it, then run the API).
- Check that the root `npm install` still works. npm workspaces ignore folders without `package.json`, but confirm it.
- Add a GitHub Actions job: `flutter analyze`, `flutter test`, `flutter build apk --debug` on every push that touches `apps/mobile_flutter/**`.

## 10. Build order (one phase per PR; update `docs/PROGRESS.md` after each)

1. **Skeleton.** FVM, pubspec, lints, folder tree, `bootstrap.dart` with error zones, dark theme tokens, router with placeholder screens.
   CI passes.
2. **Read-only public data.** Models from `dto.ts`, `pages_repository`, Discover (`/community`), host page (`/pages/:u`:
   upcoming listed, past behind a toggle, as the web page has done since module 14 — not tabs),
   event detail, `recordView`/`recordClick`, deep links matching the web URLs. *This is already useful to students.*
3. **Save and remind.** `saved_repository`, local reminders, follow a host, background sync, Saved tab, add to calendar, share.
4. **Accounts.** The Neon Auth session port, sign-up, verify OTP, sign-in, claim username, sign-out. A test signs in against the local API.
5. **Visitor actions.** Reviews and ratings on live/past events, photo upload with compression, gallery.
6. **Host dashboard.** My events, create/edit (cover upload), hide toggle, reorder, appearance editor, analytics chart.
   Once this works on a real phone, **delete `apps/mobile/` (Expo)** and update the root README and `render.yaml`/`vercel.json` if they mention it.
7. **Analytics and polish.** PostHog on app and web, opt-out, accessibility pass, app icon and splash, Play Store internal testing build.

## 11. Definition of done for each screen

- It works on a low-end Android phone and on slow 3G (use network throttling).
- Loading, error plus retry, and empty states exist.
- It uses no emojis and has icons with semantic labels.
- It has analytics events from §6.
- It has a widget test for the main state, and a repository test for any new endpoint.
- `flutter analyze` is clean.
