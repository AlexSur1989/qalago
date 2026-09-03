import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

/// Brand wordmark. Tapping navigates to the home tab when [navigateOnTap] is true.
class QalaGoLogo extends StatelessWidget {
  const QalaGoLogo({
    super.key,
    this.fontSize = 36,
    this.fit = false,
    this.navigateOnTap = true,
  });

  final double fontSize;
  final bool fit;
  final bool navigateOnTap;

  @override
  Widget build(BuildContext context) {
    final logo = RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w900,
          letterSpacing: 0,
        ),
        children: const [
          TextSpan(
            text: 'Qala',
            style: TextStyle(color: Colors.black),
          ),
          TextSpan(
            text: 'Go',
            style: TextStyle(color: AppTheme.kzBlue),
          ),
        ],
      ),
    );

    Widget child = logo;
    if (fit) {
      child = FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: logo,
      );
    }

    if (!navigateOnTap) return child;

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () => context.go('/home'),
        behavior: HitTestBehavior.opaque,
        child: child,
      ),
    );
  }
}
