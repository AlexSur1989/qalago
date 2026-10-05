import 'package:flutter/material.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';

/// Read-only UX when ad/plan purchases are disabled (LAUNCH/DISABLED or config fail-closed).
class MonetizationPurchasesUnavailableBody extends StatelessWidget {
  const MonetizationPurchasesUnavailableBody({
    super.key,
    this.onViewCampaigns,
  });

  final VoidCallback? onViewCampaigns;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.screen),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            l10n.ownerMonetizationDisabled,
            style: TextStyle(color: AppTheme.textMuted, fontSize: 15),
          ),
          if (onViewCampaigns != null) ...[
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: onViewCampaigns,
              child: Text(l10n.ownerMyCampaigns),
            ),
          ],
        ],
      ),
    );
  }
}
