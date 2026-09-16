import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Brand wordmark image. Tapping navigates to the home tab when [navigateOnTap] is true.
class QalaGoLogo extends StatelessWidget {
  const QalaGoLogo({
    super.key,
    this.height = 30,
    this.fit = false,
    this.navigateOnTap = true,
    this.excludeSemantics = true,
    this.semanticLabel = 'QalaGo',
  });

  static const _assetPath = 'assets/branding/qalago_wordmark.png';

  final double height;
  final bool fit;
  final bool navigateOnTap;
  final bool excludeSemantics;
  final String semanticLabel;

  @override
  Widget build(BuildContext context) {
    final image = Image.asset(
      _assetPath,
      height: height,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
    );

    Widget child = fit
        ? FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: image,
          )
        : image;

    if (excludeSemantics) {
      child = ExcludeSemantics(child: child);
    } else {
      child = Semantics(label: semanticLabel, child: child);
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
