# QalaGo Mobile (Flutter)

**Production native client:** **Android** and **iOS** (`apps/mobile`).

**Public browser / `qalago.kz`:** **`apps/consumer-web`** (Next.js) — not a Flutter Web deployment.

**Flutter Web** (same codebase, `web/` target): **DEV / QA / local demo / compile-regression only**. A Flutter Web build is **not** the production public QalaGo website.

## API configuration

Development defaults (no flags):

```powershell
cd apps/mobile
# Flutter Web — local DEV/QA only (not production public site)
flutter run -d chrome
# API: http://localhost:3002/api/v1 (web) or http://127.0.0.1:3002/api/v1
```

Android emulator (host machine from emulator):

```powershell
flutter run --dart-define=QALAGO_DEV_HOST=10.0.2.2
```

DEV/QA web compile check (not production public hosting):

```powershell
flutter build web --dart-define=QALAGO_API_BASE_URL=https://api.qalago.kz/api/v1 --dart-define=QALAGO_AI_BASE_URL=https://ai.qalago.kz/api/v1
```

Android Play / release (native business layer — C3.4 Samsung-qualified; **not** a code default flip):

```powershell
cd apps/mobile
flutter build appbundle --release `
  --dart-define=QALAGO_API_BASE_URL=https://api.qalago.kz/api/v1 `
  --dart-define=QALAGO_NATIVE_MAP_BUSINESS_LAYER=true
```

iOS release: **omit** `QALAGO_NATIVE_MAP_BUSINESS_LAYER=true` until iOS physical QA passes.

Optional overrides:

| Dart define | Purpose |
|-------------|---------|
| `QALAGO_API_BASE_URL` | Catalog API base (includes `/api/v1`) |
| `QALAGO_AI_BASE_URL` | AI orchestrator base (includes `/api/v1`) |
| `QALAGO_DEV_HOST` | Dev host for catalog/media/AI when overrides empty (default `127.0.0.1`, web uses `localhost`) |
| `QALAGO_MAP_STYLE_URL` | MapLibre style JSON URL (default: OpenFreeMap Liberty — DEV/QA only) |
| `QALAGO_MAP_RENDERER` | `maplibre` (device default) or `flutter_map` (widget tests / override) |
| `QALAGO_NATIVE_MAP_BUSINESS_LAYER` | Compile-time **`defaultValue: false`**. `true` enables native MapLibre GeoJSON business layers + taps (hides Flutter business overlay on MapLibre). **Android release:** pass `true` explicitly (see above). **iOS release:** do **not** pass `true` until iOS physical QA. Omitted define → legacy overlay (fail-safe). No automatic native→overlay runtime fallback if native install fails. flutter_map tests ignore this flag. |

### Map basemap (DEV/QA)

Default MapLibre style is [OpenFreeMap Liberty](https://tiles.openfreemap.org/styles/liberty) (validated on physical Android QA). Override with `--dart-define=QALAGO_MAP_STYLE_URL=...`. This is **not** approved production map infrastructure.

When the native business flag is **off** (default), MapLibre uses Flutter-projected business overlay pins. When **on**, businesses render via native GeoJSON (C3.1–C3.4 on Android).

## Tests

```powershell
flutter test
flutter analyze
flutter build web   # compile-regression for web target (DEV/QA — not production public site)
```
