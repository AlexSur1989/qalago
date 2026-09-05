# QalaGo Mobile — iOS Build Checklist

Stage 3C static audit. **Real iOS build was not executed on Windows.** Verify all items on **Mac + Xcode** before TestFlight/App Store.

## Project identifiers (do not change without product approval)

| Setting | Value |
|---------|-------|
| Bundle Identifier | `kz.qalago.qalagoMobile` |
| Display name | Qalago Mobile |
| iOS deployment target | **13.0** (`IPHONEOS_DEPLOYMENT_TARGET` in `Runner.xcodeproj`) |
| Scene lifecycle | UIKit scenes (`SceneDelegate.swift`) |

> Note: Android uses `kz.qalago.qalago_mobile` (underscore). iOS uses `kz.qalago.qalagoMobile` (camelCase). Align only with explicit product decision.

## Current configuration audit

| Item | Status |
|------|--------|
| `Info.plist` location permission | `NSLocationWhenInUseUsageDescription` present (geolocator) |
| App Transport Security (ATS) | Default — **blocks cleartext HTTP** unless exception added |
| Deep links / universal links | Not configured |
| Push notifications | Not configured |
| Background modes | Not configured |
| URL schemes | Not configured |
| Signing team | Xcode project default — **set on Mac** |

## Mac environment prerequisites

- [ ] Mac with current macOS supported by latest stable Xcode
- [ ] Xcode (from App Store) + Command Line Tools: `xcode-select --install`
- [ ] CocoaPods: `sudo gem install cocoapods` or `brew install cocoapods`
- [ ] Flutter stable, same channel as team (`flutter doctor`)
- [ ] Apple Developer account (Individual or Organization)

## First-time setup on Mac

```bash
cd apps/mobile
flutter pub get
cd ios
pod install
cd ..
flutter doctor
```

Fix any `flutter doctor` iOS toolchain issues before building.

## Signing & capabilities

- [ ] Open `ios/Runner.xcworkspace` in Xcode (not `.xcodeproj` alone after pods)
- [ ] Select Runner target → Signing & Capabilities
- [ ] Set **Team** (Apple Developer account)
- [ ] Confirm Bundle Identifier `kz.qalago.qalagoMobile` matches App Store Connect app
- [ ] Automatic signing for DEV; distribution cert for release
- [ ] No extra capabilities needed for Stage 3B ads (no push, no IAP yet)

## Privacy & permissions

- [ ] Location string in `Info.plist` is accurate for App Review
- [ ] Add future privacy strings before enabling: camera/photos (image_picker), tracking, etc.
- [ ] Prepare App Privacy questionnaire in App Store Connect

## Network & API (DEV vs PROD)

| Target | Catalog API |
|--------|-------------|
| iOS Simulator (Mac) | `http://localhost:3002/api/v1` if backend on same Mac |
| Physical iPhone (DEV) | `http://<Mac-LAN-IP>:3002/api/v1` |
| PRODUCTION | `https://api.qalago.kz/api/v1` (future) |

For DEV HTTP on device/simulator you may need ATS exception in `Info.plist` (debug/staging only):

```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsLocalNetworking</key>
  <true/>
</dict>
```

**Do not ship cleartext exceptions to production.**

## Dependency cross-platform check (Stage 3B)

All ad-related code is platform-neutral (no `dart:io` / `Platform.isAndroid` in `lib/features/ads/`).

| Package | iOS support |
|---------|-------------|
| `visibility_detector` | Yes |
| `url_launcher` | Yes |
| `flutter_secure_storage` | Yes (Keychain) |
| `geolocator` | Yes (requires location permission string) |
| `flutter_map` | Yes |
| `dio` | Yes |
| `flutter_riverpod` | Yes |
| `go_router` | Yes |

## Build & archive steps (Mac)

```bash
cd apps/mobile
flutter analyze
flutter test
flutter build ios --debug --no-codesign   # compile check without signing
flutter build ios --release                 # requires signing
```

Archive for TestFlight:

1. Xcode → Product → Archive
2. Distribute → App Store Connect → Upload
3. TestFlight internal testing
4. External TestFlight after Beta App Review (if needed)

## Functional QA on iOS (after first successful run)

Same as Android/web Stage 3B smoke:

- [ ] Home: VIP banner, HOME_PROMOTIONS, HOME_FEATURED
- [ ] Category: CATEGORY_TOP, CATEGORY_BOOST, organic dedup
- [ ] Sponsored labels visible
- [ ] Viewability: impression only after ≥50% visible for ≥1s
- [ ] Click events best-effort; navigation not blocked
- [ ] Ad API failure → organic UI unchanged

## App Store Connect (later stages)

- [ ] Create app record with Bundle ID `kz.qalago.qalagoMobile`
- [ ] Screenshots (6.7", 6.5", iPad if supported)
- [ ] Privacy policy URL
- [ ] Age rating questionnaire
- [ ] Export compliance
- [ ] TestFlight → production release

## Not in scope (Stage 3C)

- Production signing certificates upload
- TestFlight upload
- Push notifications / Firebase
- In-app purchases / real payment providers
- Admin or business monetization UI
