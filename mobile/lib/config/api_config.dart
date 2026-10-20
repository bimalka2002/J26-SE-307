import 'package:flutter/foundation.dart';

/// Backend base URL (no trailing slash).
///
/// Override at run time:
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:5000`
String resolveApiBaseUrl() {
  const fromEnv = String.fromEnvironment('API_BASE_URL');
  if (fromEnv.trim().isNotEmpty) {
    return fromEnv.trim().replaceAll(RegExp(r'/+$'), '');
  }

  // Android emulator reaches the host machine via 10.0.2.2.
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
}
