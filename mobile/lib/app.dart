import 'package:flutter/material.dart';

import 'screens/splash_screen.dart';
import 'theme/app_theme.dart';

class OralScanApp extends StatelessWidget {
  const OralScanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'OralScan',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const SplashScreen(),
    );
  }
}
