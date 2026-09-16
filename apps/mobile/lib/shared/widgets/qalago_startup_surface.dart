import 'package:flutter/material.dart';

import '../../core/theme/qalago_colors.dart';
import 'qalago_logo.dart';

/// Lightweight branded surface while release config or onboarding gate loads.
class QalaGoStartupSurface extends StatelessWidget {
  const QalaGoStartupSurface({super.key});

  static const Color background = Color(0xFFF7FAFC);

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: background,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 32),
            child: QalaGoLogo(
              height: 40,
              fit: true,
              navigateOnTap: false,
              excludeSemantics: false,
            ),
          ),
        ),
      ),
    );
  }
}

/// Matches native Android/iOS launch background tone.
Color get qalaGoLaunchBackgroundColor => QalaGoColors.background;
