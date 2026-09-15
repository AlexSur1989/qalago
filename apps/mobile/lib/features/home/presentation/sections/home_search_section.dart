import 'package:flutter/material.dart';

import '../../../../core/locale/l10n_extension.dart';
import '../../../../shared/widgets/qalago_search_field.dart';

class HomeSearchSection extends StatelessWidget {
  const HomeSearchSection({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Semantics(
      button: true,
      label: l10n.homeSearchPlaceholder,
      onTap: onTap,
      child: QalagoSearchField(
        readOnly: true,
        onTap: onTap,
        hintText: l10n.homeSearchPlaceholder,
      ),
    );
  }
}
