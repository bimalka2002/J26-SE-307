import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../services/google_auth_service.dart';
import '../services/api_client.dart';
import 'google_button.dart';
import 'google_sign_in_web_stub.dart'
    if (dart.library.js_interop) 'google_sign_in_web.dart' as web_button;

class GoogleAuthButton extends StatefulWidget {
  const GoogleAuthButton({
    super.key,
    required this.label,
    required this.onCredential,
    required this.onError,
    this.loading = false,
  });

  final String label;
  final ValueChanged<String> onCredential;
  final ValueChanged<String> onError;
  final bool loading;

  @override
  State<GoogleAuthButton> createState() => _GoogleAuthButtonState();
}

class _GoogleAuthButtonState extends State<GoogleAuthButton> {
  StreamSubscription<GoogleSignInAuthenticationEvent>? _subscription;
  bool _ready = false;
  bool _initializing = false;

  @override
  void initState() {
    super.initState();
    _setup();
  }

  Future<void> _setup() async {
    if (_initializing) return;
    _initializing = true;
    try {
      await GoogleAuthService.instance.initialize();
      if (!mounted) return;
      if (kIsWeb) {
        _subscription = GoogleAuthService.instance.signIn.authenticationEvents.listen((event) {
          if (!mounted || widget.loading || ModalRoute.of(context)?.isCurrent != true) return;
          if (event is GoogleSignInAuthenticationEventSignIn) {
            final credential = event.user.authentication.idToken;
            if (credential != null && credential.isNotEmpty) widget.onCredential(credential);
          }
        }, onError: (Object error) {
          if (mounted) widget.onError('Google sign-in failed. Please try again.');
        });
      }
      setState(() => _ready = true);
    } on ApiException catch (error) {
      if (mounted) widget.onError(error.message);
    } catch (_) {
      if (mounted) widget.onError('Google sign-in could not start. Check the Google client ID and authorized browser origin.');
    } finally {
      _initializing = false;
    }
  }

  Future<void> _nativeSignIn() async {
    try {
      final credential = await GoogleAuthService.instance.authenticateNative();
      if (mounted) widget.onCredential(credential);
    } catch (_) {
      if (mounted) widget.onError('Google sign-in failed. Please try again.');
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb && _ready) {
      return SizedBox(
        height: 52,
        child: Center(child: widget.loading ? const CircularProgressIndicator() : web_button.renderGoogleSignInButton()),
      );
    }
    return GoogleButton(
      label: widget.label,
      loading: widget.loading,
      onPressed: _ready ? _nativeSignIn : _setup,
    );
  }
}
