import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class BrandMark extends StatelessWidget {
  const BrandMark({
    super.key,
    this.size = 34,
    this.showWordmark = true,
    this.dark = true,
  });

  final double size;
  final bool showWordmark;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final ink = dark ? AppColors.ink : AppColors.surface;
    final markBg = dark ? AppColors.ink : AppColors.surface;
    final markFg = dark ? AppColors.surface : AppColors.ink;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: markBg,
            borderRadius: BorderRadius.circular(size * 0.24),
          ),
          child: CustomPaint(
            painter: _InfinityPainter(color: markFg),
          ),
        ),
        if (showWordmark) ...[
          SizedBox(width: size * 0.28),
          Text(
            'OralScan',
            style: TextStyle(
              fontSize: size * 0.62,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.8,
              color: ink,
            ),
          ),
        ],
      ],
    );
  }
}

class _InfinityPainter extends CustomPainter {
  _InfinityPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.09
      ..strokeCap = StrokeCap.round;

    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width * 0.16;

    canvas.drawCircle(Offset(cx - r * 0.85, cy), r, paint);
    canvas.drawCircle(Offset(cx + r * 0.85, cy), r, paint);
  }

  @override
  bool shouldRepaint(covariant _InfinityPainter oldDelegate) =>
      oldDelegate.color != color;
}
