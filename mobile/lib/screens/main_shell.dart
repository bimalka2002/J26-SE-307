import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../theme/app_colors.dart';
import 'home_screen.dart';
import 'login_screen.dart';
import 'scan_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, this.userName, this.initialIndex = 0});

  final String? userName;
  final int initialIndex;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
  }

  void _openTab(int index) => setState(() => _index = index);

  Future<void> _signOut() async {
    await AuthService.instance.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(
        userName: widget.userName,
        onStartScreening: () => _openTab(1),
        onViewHistory: () => _openTab(2),
      ),
      const ScanScreen(),
      const _PlaceholderTab(
        title: 'History',
        subtitle: 'Your past screenings will appear here.',
        icon: Icons.history_rounded,
      ),
      _AccountTab(
        userName: widget.userName,
        onSignOut: _signOut,
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      extendBody: true,
      body: Stack(
        children: [
          Positioned.fill(
            child: IndexedStack(index: _index, children: pages),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SafeArea(
              top: false,
              child: _FloatingNavBar(
                index: _index,
                onTap: _openTab,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FloatingNavBar extends StatelessWidget {
  const _FloatingNavBar({required this.index, required this.onTap});

  final int index;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final sidePad = (width * 0.14).clamp(36.0, 72.0);
    final barHeight = (width * 0.118).clamp(48.0, 56.0);
    final radius = barHeight / 2;
    final iconSize = (barHeight * 0.38).clamp(18.0, 21.0);
    final labelSize = (width * 0.026).clamp(9.5, 11.0);

    return Padding(
      padding: EdgeInsets.fromLTRB(sidePad, 0, sidePad, 8),
      child: Container(
        height: barHeight,
        padding: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: AppColors.surface.withValues(alpha: 0.97),
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(color: AppColors.line),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            _NavItem(
              label: 'Home',
              icon: Icons.home_outlined,
              activeIcon: Icons.home_rounded,
              selected: index == 0,
              iconSize: iconSize,
              labelSize: labelSize,
              onTap: () => onTap(0),
            ),
            _NavItem(
              label: 'Scan',
              icon: Icons.document_scanner_outlined,
              activeIcon: Icons.document_scanner_rounded,
              selected: index == 1,
              iconSize: iconSize,
              labelSize: labelSize,
              onTap: () => onTap(1),
            ),
            _NavItem(
              label: 'History',
              icon: Icons.history_rounded,
              activeIcon: Icons.history_rounded,
              selected: index == 2,
              iconSize: iconSize,
              labelSize: labelSize,
              onTap: () => onTap(2),
            ),
            _NavItem(
              label: 'Account',
              icon: Icons.person_outline_rounded,
              activeIcon: Icons.person_rounded,
              selected: index == 3,
              iconSize: iconSize,
              labelSize: labelSize,
              onTap: () => onTap(3),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.label,
    required this.icon,
    required this.activeIcon,
    required this.selected,
    required this.iconSize,
    required this.labelSize,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
  final bool selected;
  final double iconSize;
  final double labelSize;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppColors.accent : AppColors.muted;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
          decoration: BoxDecoration(
            color: selected ? AppColors.accentSoft.withValues(alpha: 0.75) : Colors.transparent,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(selected ? activeIcon : icon, size: iconSize, color: color),
              const SizedBox(height: 1),
              Text(
                label,
                style: TextStyle(
                  fontSize: labelSize,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  height: 1.1,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({
    required this.title,
    required this.subtitle,
    required this.icon,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 28, 22, 88),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 28),
            ),
            const SizedBox(height: 10),
            Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
            const Spacer(),
            Center(
              child: Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.line),
                ),
                child: Icon(icon, size: 36, color: AppColors.accent),
              ),
            ),
            const Spacer(),
            if (actionLabel != null && onAction != null)
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton(
                  onPressed: onAction,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.ink,
                    foregroundColor: AppColors.surface,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(actionLabel!),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _AccountTab extends StatelessWidget {
  const _AccountTab({required this.onSignOut, this.userName});

  final String? userName;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    final name = (userName ?? 'OralScan user').trim();

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(22, 28, 22, 88),
        children: [
          Text(
            'Account',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 28),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.line),
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.accentSoft,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.person_rounded, color: AppColors.accent),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name.isEmpty ? 'OralScan user' : name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Signed in',
                        style: TextStyle(fontSize: 13, color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.line),
            ),
            child: ListTile(
              leading: const Icon(Icons.logout_rounded, color: AppColors.ink),
              title: const Text(
                'Sign out',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              onTap: onSignOut,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
          ),
        ],
      ),
    );
  }
}
