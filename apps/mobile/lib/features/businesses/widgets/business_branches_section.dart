import 'package:flutter/material.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/business_branch_location.dart';
class BusinessBranchesSection extends StatelessWidget {
  const BusinessBranchesSection({
    super.key,
    required this.branches,
    required this.localeCode,
  });

  final List<BusinessBranchLocation> branches;
  final String localeCode;

  @override
  Widget build(BuildContext context) {
    if (branches.length <= 1) return const SizedBox.shrink();
    final l10n = context.l10n;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.businessBranchesTitle,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.textDark,
          ),
        ),
        const SizedBox(height: 10),
        ...branches.map(
          (branch) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: QalaGoColors.surfaceSubtle,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: QalaGoColors.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          branch.displayCityName(localeCode: localeCode),
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                      ),
                      if (branch.isPrimary)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: QalaGoColors.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            l10n.businessPrimaryBranchBadge,
                            style: TextStyle(
                              color: QalaGoColors.primary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                  if (branch.address.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      branch.address,
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 14,
                        height: 1.35,
                      ),
                    ),
                  ],
                  if (branch.phone != null && branch.phone!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      branch.phone!,
                      style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
