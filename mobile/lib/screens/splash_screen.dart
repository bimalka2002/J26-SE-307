import 'dart:async';

import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../theme/app_colors.dart';
import '../widgets/brand_mark.dart';
import '../widgets/tooth_scan_animation.dart';
import 'login_screen.dart';
import 'main_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _intro;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;
  Timer? _statusTimer;
  Timer? _bootTimer;
  bool _navigated = false;
  bool _sessionReady = false;
  bool _minTimeReady = false;

  static const _statuses = [
    'Initializing scan…',
    'Calibrating models…',
    'Ready to screen',
  ];
  int _statusIndex = 0;

  @override
  void initState() {
    super.initState();
    _intro = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fade = CurvedAnimation(parent: _intro, curve: Curves.easeOutCubic);
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _intro, curve: Curves.easeOutCubic));

    _intro.forward();
    _statusTimer = Timer.periodic(const Duration(milliseconds: 900), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_statusIndex >= _statuses.length - 1) {
        timer.cancel();
        return;
      }
      setState(() => _statusIndex += 1);
    });

    _bootTimer = Timer(const Duration(milliseconds: 2800), () {
      _minTimeReady = true;
      _tryNavigate();
    });
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    await AuthService.instance.restoreSession();
    if (!mounted) return;
    _sessionReady = true;
    _tryNavigate();
  }

  void _tryNavigate() {
    if (!mounted || _navigated || !_sessionReady || !_minTimeReady) return;
    _navigated = true;
    _statusTimer?.cancel();
    _bootTimer?.cancel();

    final signedIn = AuthService.instance.isSignedIn;
    final userName = AuthService.instance.currentUser?.name;

    Navigator.of(context).pushReplacement(
      PageRouteBuilder<void>(
        pageBuilder: (_, animation, __) => signedIn
            ? MainShell(userName: userName)
            : const LoginScreen(),
        transitionsBuilder: (_, animation, __, child) {
          return FadeTransition(
            opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 480),
      ),
    );
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    _bootTimer?.cancel();
    _intro.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppColors.background,
              AppColors.backgroundDeep,
            ],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fade,
            child: SlideTransition(
              position: _slide,
              child: Column(
                children: [
                  const SizedBox(height: 28),
                  const BrandMark(size: 36),
                  const Spacer(),
                  const ToothScanAnimation(size: 250),
                  const SizedBox(height: 36),
                  Text(
                    'AI oral disease screening',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.accent,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.4,
                          fontSize: 12,
                        ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Detect. Screen. Act earlier.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontSize: 26,
                        ),
                  ),
                  const SizedBox(height: 14),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 280),
                    child: Text(
                      _statuses[_statusIndex],
                      key: ValueKey(_statusIndex),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                  const Spacer(),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 28),
                    child: Text(
                      'Screening support only',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontSize: 12,
                            color: AppColors.muted.withValues(alpha: 0.8),
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
