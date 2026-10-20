# OralScan Mobile

Flutter client for OralScan. Design aligned with the web app: light blue canvas (`#dfe7f0`), black ink, blue accent (`#3b82f6`), minimal SaaS forms.

## Screens

- **Splash** — tooth scan HUD animation, then fade into login
- **Login** — email / password + Google
- **Register** — name, email, password, confirm + Google
- **Home shell** — bottom nav (Home, Scan, History, Account) with SaaS landing on Home

The mobile app uses the backend for sign-in, scan submission, results, and history.

## Run in Chrome on Linux

1. Start the backend (and the ML service if you want completed model results). From the repository root, `docker compose up -d` starts both services. Check that the API responds at `http://localhost:5000/auth/me` (a `401` response means it is running and requires sign-in).
2. In Google Cloud Console, add `http://localhost:7357` to **Authorized JavaScript origins** for the same **Web application client ID** used by `backend/.env` as `GOOGLE_CLIENT_ID`.
3. Run Flutter from `mobile/`:

```bash
flutter pub get
./run_web.sh
```

`run_web.sh` always uses `http://localhost:7357`, so Google sees the same browser origin every time. If that port is occupied, stop the other process using it rather than starting Flutter on a random port. To connect to a different backend, run `API_BASE_URL=https://your-backend.example.com ./run_web.sh`.

The app reads the public Google client ID from `GET /auth/google/config`, so you only set `GOOGLE_CLIENT_ID` on the backend. You can override it with `--dart-define=GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID` if needed. Never put a Google client secret in Flutter. A hot reload does not change compile-time defines; stop and rerun Flutter after changing them.

For a backend deployed on Render, use its public HTTPS URL for `API_BASE_URL`. A browser preview must reach that URL from your computer. If using a production backend, its `FRONTEND_ORIGIN` must include `http://localhost:7357` so the browser can call it.

The scan accepts an oral photo, an X-ray, or both. You can skip the oral photo step, but if you do, you must add an X-ray before continuing.

Scan creation saves images through Cloudinary before starting the ML models. If creation fails, check the backend log for `create analysis error (store oral_photo image)` or similar. Confirm the backend has working `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` values.

## Run on iOS Simulator (Xcode)

### Prerequisites

1. Flutter installed (`flutter doctor`)
2. Xcode from the App Store
3. Once after installing Xcode:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
open -a Simulator
```

### Launch the app

```bash
cd mobile
flutter pub get
flutter devices          # confirm an iPhone simulator is listed
flutter run -d ios
```

Or pick a specific simulator:

```bash
xcrun simctl list devices available
flutter run -d "iPhone 16"
```

### Open in Xcode (optional)

```bash
cd mobile/ios
open Runner.xcworkspace
```

Then choose a simulator in Xcode and press **Run**. Prefer `flutter run` for day-to-day work.

### Hot reload

With `flutter run` active:

- Press `r` — hot reload
- Press `R` — hot restart
- Press `q` — quit

## Project layout

```text
lib/
  main.dart
  app.dart
  theme/
  screens/
  widgets/
```
