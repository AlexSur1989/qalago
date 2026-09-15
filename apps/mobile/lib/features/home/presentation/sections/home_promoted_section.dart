import 'package:flutter/material.dart';

import '../../../ads/widgets/home_ad_slots.dart';

/// Paid HOME_FEATURED placement — canonical Home position #7 (after Nearby).
class HomePromotedSection extends StatelessWidget {
  const HomePromotedSection({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      key: Key('home_section_featured'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        HomeFeaturedAdSlot(),
      ],
    );
  }
}
