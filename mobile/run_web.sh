#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Google OAuth requires the browser origin to match a registered, stable port.
flutter run -d chrome --web-hostname localhost --web-port 7357 \
  --dart-define="API_BASE_URL=${API_BASE_URL:-http://localhost:5000}" "$@"
