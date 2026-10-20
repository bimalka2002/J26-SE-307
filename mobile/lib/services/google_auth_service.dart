import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'api_client.dart';

class GoogleAuthService {
  GoogleAuthService._();

  static final instance = GoogleAuthService._();
  static const clientId = String.fromEnvironment('GOOGLE_CLIENT_ID');
  static const iosClientId = String.fromEnvironment('GOOGLE_IOS_CLIENT_ID');

  final signIn = GoogleSignIn.instance;
  Future<void>? _initialization;
  final _api = ApiClient();

  Future<void> initialize() async {
    try {
      await (_initialization ??= _initialize());
    } catch (_) {
      _initialization = null;
      rethrow;
    }
  }

  Future<void> _initialize() async {
    var webClientId = clientId.trim();
    if (webClientId.isEmpty) {
      final config = await _api.get('/auth/google/config');
      webClientId = config['clientId']?.toString().trim() ?? '';
    }
    if (webClientId.isEmpty) {
      throw const ApiException('Google sign-in is not configured on the backend.');
    }
    await signIn.initialize(
      clientId: kIsWeb ? webClientId : (defaultTargetPlatform == TargetPlatform.iOS && iosClientId.isNotEmpty ? iosClientId : null),
      serverClientId: kIsWeb ? null : webClientId,
    );
  }

  Future<String> authenticateNative() async {
    await initialize();
    if (!signIn.supportsAuthenticate()) {
      throw const ApiException('Google sign-in is unavailable on this device.');
    }
    final account = await signIn.authenticate();
    final credential = account.authentication.idToken;
    if (credential == null || credential.isEmpty) {
      throw const ApiException('Google did not provide a sign-in credential.');
    }
    return credential;
  }

  Future<void> signOut() async {
    if (_initialization == null) return;
    try {
      await _initialization;
      await signIn.signOut();
    } catch (_) {
      // The OralScan session is still removed even if Google is unavailable.
    }
  }
}
