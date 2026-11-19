# Flutter mobile app: Claude Code tools, working rules and sources

> Companion to `docs/flutter-mobile-plan.md`. Read both before any work on `apps/mobile_flutter/`.
> Do not merge, move or delete this file without asking the user.

## Tools and skills: what each one is for

| Tool | What it gives Claude Code | When to use it |
|---|---|---|
| `dart-flutter` plugin (flutter/agent-plugins) | Official Flutter and Dart skills (layouts, tests, etc.) plus the Dart MCP server | Always on |
| Dart and Flutter MCP server | Live analyzer errors, running tests, `dart format`, pub.dev lookup | After every edit |
| Flutter `rules.md` in `CLAUDE.md` | Default Flutter coding style and conventions | Always loaded |
| `evanca/flutter-ai-rules` | Riverpod, Effective Dart and mocktail skills | When writing providers and tests |
| `mobile-app-ui-design` (already installed) | Mobile UI conventions and layout decisions | Design pass and every new screen |

Setup commands are in §8 of `docs/flutter-mobile-plan.md`.

## Working rules for Claude Code

1. Work **one phase (§10 of the plan) at a time** where you can, and update `docs/PROGRESS.md` after each.
   Phases 2 to 7 were built in one pass on 2026-11-19 because the toolchain on the owner's laptop took
   most of a session to install; the progress row says what landed in each phase.
2. **Before new screens**, show the user the design and wait for approval. Done for Discover, a host page and
   event detail on 2026-11-19: rows-and-carousels Discover, and host pages edge-to-edge in the host's colours
   with floating Back and Share.
3. Never change `apps/api` or `apps/web` without saying so in the commit message. Any API change must keep the web app working
   (run the existing Vitest suites).
4. If an endpoint or field in the plan doesn't match the code, the code wins. Fix the plan in the same commit.
5. Don't add packages outside §2 of the plan without writing down why.
6. Notifications are on-device only (§5 of the plan). Don't add remote push, Firebase or a push server.
7. Ask the user before deleting `apps/mobile/` (Expo), before any store release, and before turning on session replay.

## Sources (checked Nov 2026)

- Flutter AI setup for Claude Code (plugin, rules, MCP): https://docs.flutter.dev/ai/agent-skills · https://docs.flutter.dev/ai/mcp-server · https://docs.flutter.dev/ai/ai-rules
- Flutter rules template: https://raw.githubusercontent.com/flutter/flutter/refs/heads/main/docs/rules/rules.md
- PostHog pricing and free tier: https://posthog.com/pricing
- PostHog Flutter SDK: https://pub.dev/packages/posthog_flutter
- Local notifications: https://pub.dev/packages/flutter_local_notifications · background sync: https://pub.dev/packages/workmanager
- Community Flutter skills: https://github.com/evanca/flutter-ai-rules
