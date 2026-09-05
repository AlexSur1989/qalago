# QalaGo Mobile — Android Build (DEV & Release prep)

Stage 3C audit document. Commands assume repo root unless noted.

## Prerequisites (Windows)

1. **Flutter stable** (project tested with 3.41.7 / Dart 3.11.5)
2. **Android Studio** (includes SDK Manager, emulator, JDK)
3. **Android SDK** — default path after install:
   - `%LOCALAPPDATA%\Android\Sdk`
4. **JDK 17** — required by `apps/mobile/android/app/build.gradle.kts`

After install:

```powershell
flutter doctor -v
flutter config --android-sdk "$env:LOCALAPPDATA\Android\Sdk"
```

If `flutter doctor` still reports missing SDK, verify `platform-tools`, `build-tools`, and at least one `platforms;android-XX` are installed via SDK Manager.

## Project identifiers (do not change without product approval)

| Setting | Value |
|---------|-------|
| `applicationId` | `kz.qalago.qalago_mobile` |
| `namespace` | `kz.qalago.qalago_mobile` |
| Gradle (root) | AGP 8.11.1, Kotlin 2.2.20, Gradle 8.14 |
| `minSdk` | 24 (Flutter default) |
| `targetSdk` | 36 (Flutter default) |
| `compileSdk` | 36 (Flutter default) |
| Java/Kotlin target | 17 |

## Permissions & network (current audit)

| Item | Location | Notes |
|------|----------|-------|
| `INTERNET` | `android/app/src/debug/AndroidManifest.xml`, `profile/` | Present for debug/profile only |
| `INTERNET` | `android/app/src/main/AndroidManifest.xml` | **Not present** — add before release APK/AAB |
| Location | `main/AndroidManifest.xml` | `ACCESS_FINE/COARSE_LOCATION` for geolocator |
| Cleartext HTTP | Not configured | Required for DEV `http://` API on Android 9+ |

### DEV cleartext HTTP

Mobile app uses `http://127.0.0.1:3002` (see `AppConstants.baseUrl`). On Android:

| Target | API host |
|--------|----------|
| Android emulator | `http://10.0.2.2:3002/api/v1` |
| Physical device | `http://<LAN-IP>:3002/api/v1` (same Wi‑Fi as dev machine) |
| Production (future) | `https://api.qalago.kz/api/v1` |

**Do not use `localhost` on device/emulator** — it refers to the device itself.

For emulator DEV testing, either:

- temporarily override base URL at build/run time (future `--dart-define`), or
- add debug-only `networkSecurityConfig` with cleartext allowed for `10.0.2.2` / LAN IP.

## API environment matrix

| Environment | Flutter target | Catalog API |
|-------------|----------------|-------------|
| DEV web | Chrome / `flutter run -d chrome` | `http://localhost:3002/api/v1` |
| DEV Windows desktop | `flutter run -d windows` | `http://127.0.0.1:3002/api/v1` |
| DEV Android emulator | AVD | `http://10.0.2.2:3002/api/v1` |
| DEV physical Android | USB/Wi‑Fi | `http://<PC-LAN-IP>:3002/api/v1` |
| DEV iOS simulator (Mac) | Simulator | `http://localhost:3002/api/v1` or Mac LAN IP |
| PRODUCTION | Store builds | `https://api.qalago.kz/api/v1` (future; not hardcoded yet) |

Start backend:

```powershell
cd services/catalog-api
$env:PORT = "3002"
npm run start:dev
```

Demo ad campaigns (DEV only):

```powershell
cd services/catalog-api
npm run seed:monetization-demo
```

## Build commands

```powershell
cd apps/mobile
flutter pub get
flutter analyze
flutter test
flutter build web          # compile check (Windows)
flutter build apk --debug  # requires Android SDK
flutter build appbundle --debug
```

**Signing:** debug builds use debug keystore. Do not create production signing keys in Stage 3C.

## Stage 3C machine status

On the audit machine (Windows 2026-09-05):

- Flutter / Dart / Chrome / Windows: OK
- Android SDK: **not installed**
- Java/JDK in PATH: **not found**
- `flutter build apk --debug`: **BLOCKED** until SDK + JDK installed

## Manual smoke (after SDK install)

1. `npm run seed:monetization-demo`
2. `flutter run -d <android-device>` with correct API base URL
3. Verify Home: VIP banner, promoted promotions, featured businesses
4. Verify Category: TOP, BOOST, organic list without duplicates
5. Verify ad failure isolation: stop API → Home/Category still work
