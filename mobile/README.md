# OralScan Mobile

Flutter client for OralScan. Design aligned with the web app: light blue canvas (`#dfe7f0`), black ink, blue accent (`#3b82f6`), minimal SaaS forms.

## Screens

- **Splash** — tooth scan HUD animation, then fade into login
- **Login** — email / password + Google
- **Register** — name, email, password, confirm + Google
- **Home shell** — bottom nav (Home, Scan, History, Account) with SaaS landing on Home

Auth API wiring is next; successful sign-in currently navigates to Home.

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
