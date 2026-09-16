import 'package:flutter/material.dart';

import '../../core/theme/qalago_colors.dart';
import 'qalago_logo.dart';

/// Lightweight branded surface while release config or onboarding gate loads.
class QalaGoStartupSurface extends StatelessWidget {
  const QalaGoStartupSurface({super.key});

  static const Color background = Color(0xFFF7FAFC);

  /// ~30–40% of width, clamped for phones and large text layouts.
  static double wordmarkWidthFor(BoxConstraints constraints) {
    final target = constraints.maxWidth * 0.36;
    return target.clamp(120.0, 200.0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: background,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final logoWidth = wordmarkWidthFor(constraints);
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: QalaGoLogo(
                  width: logoWidth,
                  fit: true,
                  navigateOnTap: false,
                  excludeSemantics: false,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

/// Matches native Android/iOS launch background tone.
Color get qalaGoLaunchBackgroundColor => QalaGoColors.background;
