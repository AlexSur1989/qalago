import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Brand wordmark image. Tapping navigates to the home tab when [navigateOnTap] is true.
class QalaGoLogo extends StatelessWidget {
  const QalaGoLogo({
    super.key,
    this.height = 30,
    this.width,
    this.fit = false,
    this.navigateOnTap = true,
    this.excludeSemantics = true,
    this.semanticLabel = 'QalaGo',
  });

  static const _assetPath = 'assets/branding/qalago_wordmark.png';

  final double? height;
  final double? width;
  final bool fit;
  final bool navigateOnTap;
  final bool excludeSemantics;
  final String semanticLabel;

  @override
  Widget build(BuildContext context) {
    final image = Image.asset(
      _assetPath,
      height: width == null ? height : null,
      width: width,
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

/// Consumer root-tab header wordmark sizing (Home, Map, Favorites, Profile, Promotions).
class QalaGoConsumerHeaderLogo extends StatelessWidget {
  const QalaGoConsumerHeaderLogo({super.key, this.layoutWidth});

  /// When embedded in [LayoutBuilder], pass [constraints.maxWidth] for accurate compact detection.
  final double? layoutWidth;

  static const normalHeight = 35.0;
  static const compactHeight = 31.0;

  static double resolveHeight({
    required double width,
    required double textScaleFactor,
  }) {
    final compact = width < 360 || textScaleFactor >= 1.33;
    return compact ? compactHeight : normalHeight;
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final width = layoutWidth ?? mq.size.width;
    final height = resolveHeight(
      width: width,
      textScaleFactor: mq.textScaler.scale(1),
    );
    return QalaGoLogo(height: height, fit: true);
  }
}
