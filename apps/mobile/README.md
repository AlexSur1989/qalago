# QalaGo Mobile (Flutter)

Consumer + owner Flutter app for QalaGo.

## API configuration

Development defaults (no flags):

```powershell
cd apps/mobile
flutter run -d chrome
# API: http://localhost:3002/api/v1 (web) or http://127.0.0.1:3002/api/v1
```

Android emulator (host machine from emulator):

```powershell
flutter run --dart-define=QALAGO_DEV_HOST=10.0.2.2
```

Production-like build:

```powershell
flutter build web --dart-define=QALAGO_API_BASE_URL=https://api.qalago.kz/api/v1 --dart-define=QALAGO_AI_BASE_URL=https://ai.qalago.kz/api/v1
```

Optional overrides:

| Dart define | Purpose |
|-------------|---------|
| `QALAGO_API_BASE_URL` | Catalog API base (includes `/api/v1`) |
| `QALAGO_AI_BASE_URL` | AI orchestrator base (includes `/api/v1`) |
| `QALAGO_DEV_HOST` | Dev host for catalog/media/AI when overrides empty (default `127.0.0.1`, web uses `localhost`) |

## Tests

```powershell
flutter test
flutter analyze
flutter build web
```
