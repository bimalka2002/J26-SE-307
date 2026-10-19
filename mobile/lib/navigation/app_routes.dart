import 'package:flutter/material.dart';

import '../screens/main_shell.dart';

void goToHome(BuildContext context, {String? userName}) {
  Navigator.of(context).pushAndRemoveUntil(
    PageRouteBuilder<void>(
      pageBuilder: (_, animation, __) => MainShell(userName: userName),
      transitionsBuilder: (_, animation, __, child) {
        return FadeTransition(
          opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
          child: child,
        );
      },
      transitionDuration: const Duration(milliseconds: 380),
    ),
    (_) => false,
  );
}
