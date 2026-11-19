# Event Tree mobile (Flutter)

The Flutter app for Event Tree, replacing the Expo app in `apps/mobile/` once it reaches parity.
The spec is [`docs/flutter-mobile-plan.md`](../../docs/flutter-mobile-plan.md); progress is in
[`docs/PROGRESS.md`](../../docs/PROGRESS.md).

## Flutter version

**Flutter 3.47.8 stable** (Dart 3.13.7), pinned in `.fvmrc` and in `pubspec.yaml`
(`environment.flutter`). CI reads the version from `.fvmrc`.

With FVM, prefix commands with `fvm` (`fvm flutter run`). Without FVM, make sure
`flutter --version` prints 3.47.8 and use plain `flutter`.

We move to a newer stable later, one upgrade at a time: change `.fvmrc` and `pubspec.yaml`,
then run analyze, test and a debug APK build before committing.

## Run it

```sh
cd apps/mobile_flutter
fvm flutter pub get

# Android emulator (the API on the host is 10.0.2.2); a real phone uses the PC's LAN IP
fvm flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000

# Quick look in Chrome
fvm flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:4000
```

The API port is 4000 unless `PORT` is set (`apps/api/src/config.ts`). Start the API first; see
the root `README.md`.

## Checks (run before every commit)

```sh
fvm dart format lib test
fvm flutter analyze --fatal-infos   # must be 0 issues
fvm flutter test
fvm flutter build apk --debug
```

## URLs

Screens shared with the web use the web's paths, so a shared link opens the same thing:
`/explore` (Discover), `/admin` (Dashboard), `/:username` and `/:username/:slug`.
App-only tabs live under the reserved `/app/` prefix: `/app/saved` and `/app/profile`.
