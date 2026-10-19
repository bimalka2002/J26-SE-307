import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Animated tooth scan HUD used on the splash screen.
class ToothScanAnimation extends StatefulWidget {
  const ToothScanAnimation({super.key, this.size = 220});

  final double size;

  @override
  State<ToothScanAnimation> createState() => _ToothScanAnimationState();
}

class _ToothScanAnimationState extends State<ToothScanAnimation>
    with TickerProviderStateMixin {
  late final AnimationController _spin;
  late final AnimationController _beam;
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _spin = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();
    _beam = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat(reverse: true);
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _spin.dispose();
    _beam.dispose();
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;

    return SizedBox(
      width: size,
      height: size,
      child: AnimatedBuilder(
        animation: Listenable.merge([_spin, _beam, _pulse]),
        builder: (context, _) {
          return CustomPaint(
            painter: _ToothScanPainter(
              spin: _spin.value,
              beam: Curves.easeInOut.transform(_beam.value),
              pulse: Curves.easeInOut.transform(_pulse.value),
            ),
          );
        },
      ),
    );
  }
}

class _ToothScanPainter extends CustomPainter {
  _ToothScanPainter({
    required this.spin,
    required this.beam,
    required this.pulse,
  });

  final double spin;
  final double beam;
  final double pulse;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width * 0.42;

    // Soft glow
    final glow = Paint()
      ..shader = RadialGradient(
        colors: [
          AppColors.accent.withValues(alpha: 0.18 + pulse * 0.1),
          AppColors.accent.withValues(alpha: 0),
        ],
      ).createShader(Rect.fromCircle(center: center, radius: radius * 1.35));
    canvas.drawCircle(center, radius * 1.35, glow);

    // Outer ring
    final ringPaint = Paint()
      ..color = AppColors.surface.withValues(alpha: 0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6;
    canvas.drawCircle(center, radius, ringPaint);

    // Dashed inner ring (rotating)
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(-spin * math.pi * 2);
    final dashPaint = Paint()
      ..color = AppColors.accent.withValues(alpha: 0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4
      ..strokeCap = StrokeCap.round;
    _drawDashedCircle(canvas, radius * 0.78, dashPaint, 28);
    canvas.restore();

    // Radar wedge
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(spin * math.pi * 2);
    final radar = Paint()
      ..shader = SweepGradient(
        startAngle: 0,
        endAngle: math.pi / 3,
        colors: [
          AppColors.accent.withValues(alpha: 0.0),
          AppColors.accent.withValues(alpha: 0.22),
          AppColors.accent.withValues(alpha: 0.0),
        ],
      ).createShader(Rect.fromCircle(center: Offset.zero, radius: radius));
    canvas.drawCircle(Offset.zero, radius * 0.96, radar);
    canvas.restore();

    // Corner brackets
    final bracketPaint = Paint()
      ..color = AppColors.accent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.2
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final frame = Rect.fromCenter(
      center: center,
      width: size.width * 0.58,
      height: size.height * 0.58,
    );
    _drawCorners(canvas, frame, bracketPaint, 18);

    // Tooth glyph
    _drawTooth(canvas, center, size.width * 0.18, pulse);

    // Horizontal scan beam
    final beamY = frame.top + frame.height * beam;
    final beamPaint = Paint()
      ..shader = LinearGradient(
        colors: [
          AppColors.accent.withValues(alpha: 0),
          AppColors.accent.withValues(alpha: 0.95),
          AppColors.accent.withValues(alpha: 0),
        ],
      ).createShader(Rect.fromLTWH(frame.left, beamY - 1, frame.width, 2));
    canvas.drawRect(Rect.fromLTWH(frame.left, beamY - 1, frame.width, 2), beamPaint);

    final trail = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          AppColors.accent.withValues(alpha: 0),
          AppColors.accent.withValues(alpha: 0.16),
        ],
      ).createShader(Rect.fromLTWH(frame.left, beamY - 36, frame.width, 36));
    canvas.drawRect(Rect.fromLTWH(frame.left, beamY - 36, frame.width, 36), trail);

    // Crosshair
    final cross = Paint()
      ..color = AppColors.accent.withValues(alpha: 0.65)
      ..strokeWidth = 1.2;
    canvas.drawLine(
      Offset(center.dx - 14, center.dy),
      Offset(center.dx + 14, center.dy),
      cross,
    );
    canvas.drawLine(
      Offset(center.dx, center.dy - 14),
      Offset(center.dx, center.dy + 14),
      cross,
    );
  }

  void _drawTooth(Canvas canvas, Offset center, double scale, double pulse) {
    final s = scale * (0.96 + pulse * 0.04);
    final cx = center.dx;
    final cy = center.dy;

    // Classic molar silhouette: scalloped crown + dual roots.
    final path = Path()
      // Left crown shoulder
      ..moveTo(cx - s * 0.95, cy - s * 0.15)
      ..cubicTo(
        cx - s * 1.05,
        cy - s * 0.55,
        cx - s * 0.85,
        cy - s * 1.05,
        cx - s * 0.55,
        cy - s * 1.15,
      )
      // Left cusp
      ..cubicTo(
        cx - s * 0.42,
        cy - s * 1.28,
        cx - s * 0.28,
        cy - s * 1.12,
        cx - s * 0.18,
        cy - s * 1.05,
      )
      // Center groove
      ..cubicTo(
        cx - s * 0.08,
        cy - s * 0.95,
        cx + s * 0.08,
        cy - s * 0.95,
        cx + s * 0.18,
        cy - s * 1.05,
      )
      // Right cusp
      ..cubicTo(
        cx + s * 0.28,
        cy - s * 1.12,
        cx + s * 0.42,
        cy - s * 1.28,
        cx + s * 0.55,
        cy - s * 1.15,
      )
      // Right crown shoulder
      ..cubicTo(
        cx + s * 0.85,
        cy - s * 1.05,
        cx + s * 1.05,
        cy - s * 0.55,
        cx + s * 0.95,
        cy - s * 0.15,
      )
      // Right neck into root
      ..cubicTo(
        cx + s * 0.82,
        cy + s * 0.2,
        cx + s * 0.7,
        cy + s * 0.45,
        cx + s * 0.55,
        cy + s * 0.7,
      )
      // Right root tip
      ..cubicTo(
        cx + s * 0.42,
        cy + s * 1.15,
        cx + s * 0.28,
        cy + s * 1.45,
        cx + s * 0.22,
        cy + s * 1.35,
      )
      // Root cleft
      ..cubicTo(
        cx + s * 0.12,
        cy + s * 1.05,
        cx - s * 0.12,
        cy + s * 1.05,
        cx - s * 0.22,
        cy + s * 1.35,
      )
      // Left root tip
      ..cubicTo(
        cx - s * 0.28,
        cy + s * 1.45,
        cx - s * 0.42,
        cy + s * 1.15,
        cx - s * 0.55,
        cy + s * 0.7,
      )
      // Left neck back to crown
      ..cubicTo(
        cx - s * 0.7,
        cy + s * 0.45,
        cx - s * 0.82,
        cy + s * 0.2,
        cx - s * 0.95,
        cy - s * 0.15,
      )
      ..close();

    final fill = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          AppColors.surface,
          const Color(0xFFF3F7FB),
          AppColors.accentSoft.withValues(alpha: 0.55),
        ],
        stops: const [0.0, 0.45, 1.0],
      ).createShader(
        Rect.fromCenter(center: center, width: s * 2.3, height: s * 2.9),
      )
      ..style = PaintingStyle.fill;

    final stroke = Paint()
      ..color = AppColors.ink.withValues(alpha: 0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeJoin = StrokeJoin.round;

    canvas.drawPath(path, fill);
    canvas.drawPath(path, stroke);

    // Crown highlight
    final highlight = Paint()
      ..color = Colors.white.withValues(alpha: 0.55 + pulse * 0.15)
      ..style = PaintingStyle.fill;
    canvas.drawOval(
      Rect.fromCenter(
        center: Offset(cx - s * 0.18, cy - s * 0.55),
        width: s * 0.42,
        height: s * 0.28,
      ),
      highlight,
    );

    // Subtle groove line for enamel detail
    final groove = Paint()
      ..color = AppColors.ink.withValues(alpha: 0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(cx, cy - s * 0.85),
      Offset(cx, cy - s * 0.15),
      groove,
    );
  }

  void _drawDashedCircle(Canvas canvas, double radius, Paint paint, int dashes) {
    const gap = 0.45;
    final sweep = (math.pi * 2) / dashes;
    for (var i = 0; i < dashes; i++) {
      canvas.drawArc(
        Rect.fromCircle(center: Offset.zero, radius: radius),
        i * sweep,
        sweep * (1 - gap),
        false,
        paint,
      );
    }
  }

  void _drawCorners(Canvas canvas, Rect rect, Paint paint, double len) {
    // TL
    canvas.drawLine(rect.topLeft, rect.topLeft + Offset(len, 0), paint);
    canvas.drawLine(rect.topLeft, rect.topLeft + Offset(0, len), paint);
    // TR
    canvas.drawLine(rect.topRight, rect.topRight + Offset(-len, 0), paint);
    canvas.drawLine(rect.topRight, rect.topRight + Offset(0, len), paint);
    // BL
    canvas.drawLine(rect.bottomLeft, rect.bottomLeft + Offset(len, 0), paint);
    canvas.drawLine(rect.bottomLeft, rect.bottomLeft + Offset(0, -len), paint);
    // BR
    canvas.drawLine(rect.bottomRight, rect.bottomRight + Offset(-len, 0), paint);
    canvas.drawLine(rect.bottomRight, rect.bottomRight + Offset(0, -len), paint);
  }

  @override
  bool shouldRepaint(covariant _ToothScanPainter oldDelegate) {
    return oldDelegate.spin != spin ||
        oldDelegate.beam != beam ||
        oldDelegate.pulse != pulse;
  }
}
