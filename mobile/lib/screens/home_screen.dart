import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../widgets/brand_mark.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    this.userName,
    this.onStartScreening,
    this.onViewHistory,
  });

  final String? userName;
  final VoidCallback? onStartScreening;
  final VoidCallback? onViewHistory;

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final name = (userName ?? 'there').trim();
    final displayName = name.isEmpty ? 'there' : name.split(' ').first;
    final size = MediaQuery.sizeOf(context);
    final topInset = MediaQuery.paddingOf(context).top;
    // Compact hero that scales with screen height
    final heroHeight = (size.height * 0.32).clamp(200.0, 280.0);

    return ColoredBox(
      color: AppColors.background,
      child: Stack(
        children: [
          // Fixed hero — covered by the scrolling sheet
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: heroHeight,
            child: _HeroHeader(
              topInset: topInset,
              greeting: '$_greeting, $displayName',
            ),
          ),

          // Page content scrolls over the image
          Positioned.fill(
            child: ListView(
              physics: const BouncingScrollPhysics(),
              padding: EdgeInsets.only(top: heroHeight - 22),
              children: [
                Container(
                  decoration: const BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x14000000),
                        blurRadius: 20,
                        offset: Offset(0, -6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: 10),
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.line,
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        child: _SearchPill(onTap: onStartScreening),
                      ),
                      const SizedBox(height: 14),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        child: Row(
                          children: [
                            Expanded(
                              child: _QuickAction(
                                icon: Icons.document_scanner_outlined,
                                label: 'New scan',
                                onTap: onStartScreening,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _QuickAction(
                                icon: Icons.history_rounded,
                                label: 'History',
                                onTap: onViewHistory,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 26),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 22),
                        child: Text(
                          'WHAT YOU CAN DO',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.5,
                            color: AppColors.accent,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        height: 248,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 18),
                          physics: const BouncingScrollPhysics(),
                          itemCount: _features.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (context, index) {
                            return _FeatureTile(
                              feature: _features[index],
                              index: index,
                            );
                          },
                        ),
                      ),
                      SizedBox(height: 96 + MediaQuery.paddingOf(context).bottom),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroHeader extends StatelessWidget {
  const _HeroHeader({
    required this.topInset,
    required this.greeting,
  });

  final double topInset;
  final String greeting;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final titleSize = (width * 0.075).clamp(26.0, 32.0);

    return Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          'assets/brand/home-hero.png',
          fit: BoxFit.cover,
          alignment: Alignment.center,
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withValues(alpha: 0.3),
                Colors.black.withValues(alpha: 0.05),
                Colors.black.withValues(alpha: 0.5),
              ],
              stops: const [0, 0.4, 1],
            ),
          ),
        ),
        Positioned(
          top: topInset + 10,
          left: 18,
          right: 18,
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const BrandMark(size: 30, showWordmark: false),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  greeting,
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink,
                  ),
                ),
              ),
            ],
          ),
        ),
        Positioned(
          left: 20,
          right: 20,
          bottom: 30,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Oral screening,\non demand',
                style: TextStyle(
                  fontSize: titleSize,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -1.0,
                  height: 1.08,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Photo or X-ray · AI-assisted results',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withValues(alpha: 0.88),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SearchPill extends StatelessWidget {
  const _SearchPill({this.onTap});

  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      elevation: 0,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.fromLTRB(12, 12, 14, 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.line),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 22,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.ink,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.search_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Start a screening',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.3,
                        color: AppColors.ink,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Upload an oral photo or dental X-ray',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 13,
                color: AppColors.muted.withValues(alpha: 0.8),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface.withValues(alpha: 0.92),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.line),
          ),
          child: Row(
            children: [
              Icon(icon, size: 20, color: AppColors.accent),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureData {
  const _FeatureData({
    required this.chip,
    required this.title,
    required this.text,
    required this.icon,
    this.imageAsset,
  });

  final String chip;
  final String title;
  final String text;
  final IconData icon;
  final String? imageAsset;
}

const _features = [
  _FeatureData(
    chip: 'Capture',
    title: 'Photo & X-ray screening',
    text: 'Upload an intraoral photo and optionally a dental X-ray.',
    icon: Icons.photo_camera_outlined,
    imageAsset: 'assets/features/capture.png',
  ),
  _FeatureData(
    chip: 'Detect',
    title: 'Specialist disease models',
    text: 'Screen for OLP, OSMF, ELP, and caries signals.',
    icon: Icons.auto_awesome_outlined,
    imageAsset: 'assets/features/detect.png',
  ),
  _FeatureData(
    chip: 'Report',
    title: 'Structured findings',
    text: 'Review clear per-condition outputs in your account.',
    icon: Icons.description_outlined,
    imageAsset: 'assets/features/report.png',
  ),
  _FeatureData(
    chip: 'Protect',
    title: 'Secure account access',
    text: 'Keep uploads and analysis history private.',
    icon: Icons.lock_outline_rounded,
    imageAsset: 'assets/features/protect.png',
  ),
];

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({required this.feature, required this.index});

  final _FeatureData feature;
  final int index;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 168,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.line),
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (feature.imageAsset != null)
                    Image.asset(
                      feature.imageAsset!,
                      fit: BoxFit.cover,
                      alignment: Alignment.center,
                    )
                  else
                    ColoredBox(
                      color: AppColors.accentSoft.withValues(alpha: 0.55),
                      child: Center(
                        child: Icon(feature.icon, size: 36, color: AppColors.accent),
                      ),
                    ),
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.92),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        feature.chip.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.6,
                          color: Color(0xFF1D4ED8),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Text(
                      '0${index + 1}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Colors.white.withValues(alpha: 0.9),
                        shadows: const [
                          Shadow(blurRadius: 6, color: Color(0x66000000)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Text(
          //   feature.title,
          //   maxLines: 2,
          //   overflow: TextOverflow.ellipsis,
          //   style: const TextStyle(
          //     fontSize: 14,
          //     fontWeight: FontWeight.w700,
          //     letterSpacing: -0.3,
          //     height: 1.25,
          //     color: AppColors.ink,
          //   ),
          // ),
          // const SizedBox(height: 4),
          Text(
            feature.text,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 11.5,
              height: 1.35,
              color: AppColors.muted,
            ),
          ),
        ],
      ),
    );
  }
}

