import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/models/business_branch_location.dart';
import '../../owner_branch_availability.dart';
import '../../providers/owner_locations_provider.dart';

class BranchAvailabilitySelector extends ConsumerWidget {
  const BranchAvailabilitySelector({
    super.key,
    required this.businessId,
    required this.value,
    required this.onChanged,
    this.readOnly = false,
    this.validationError,
  });

  final String businessId;
  final BranchAvailabilityState value;
  final ValueChanged<BranchAvailabilityState> onChanged;
  final bool readOnly;
  final String? validationError;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final locationsAsync = ref.watch(ownerBusinessLocationsProvider(businessId));

    return locationsAsync.when(
      loading: () => const LinearProgressIndicator(minHeight: 2),
      error: (_, __) => Text(
        l10n.errorLoadFailed,
        style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
      ),
      data: (locations) {
        final knownIds = locations.map((l) => l.id).toList();
        final missing = missingBranchLocationIds(value, knownIds);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.ownerBranchAvailabilityHeading,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            RadioListTile<String>(
              contentPadding: EdgeInsets.zero,
              title: Text(l10n.ownerBranchAvailabilityModeAll),
              value: branchAvailabilityModeAll,
              groupValue: value.mode,
              onChanged: readOnly
                  ? null
                  : (mode) {
                      if (mode == null) return;
                      onChanged(setBranchAvailabilityMode(value, mode));
                    },
            ),
            RadioListTile<String>(
              contentPadding: EdgeInsets.zero,
              title: Text(l10n.ownerBranchAvailabilityModeSelected),
              value: branchAvailabilityModeSelected,
              groupValue: value.mode,
              onChanged: readOnly || locations.isEmpty
                  ? null
                  : (mode) {
                      if (mode == null) return;
                      onChanged(setBranchAvailabilityMode(value, mode));
                    },
            ),
            if (locations.isEmpty)
              Padding(
                padding: const EdgeInsets.only(left: 4, bottom: 8),
                child: Text(
                  l10n.ownerBranchAvailabilityNoBranches,
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                ),
              ),
            if (value.mode == branchAvailabilityModeSelected && locations.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                l10n.ownerBranchAvailabilitySelectBranches,
                style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
              ...locations.map((loc) => _LocationCheckboxTile(
                    location: loc,
                    checked: value.selectedLocationIds.contains(loc.id),
                    readOnly: readOnly,
                    onChanged: (checked) {
                      onChanged(
                        toggleBranchLocationSelection(value, loc.id, checked),
                      );
                    },
                  )),
            ],
            if (missing.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  l10n.ownerBranchAvailabilityMissingUnresolved,
                  style: TextStyle(color: AppSemanticColors.warning, fontSize: 12),
                ),
              ),
            if (validationError != null && validationError!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  validationError!,
                  style: TextStyle(color: AppSemanticColors.warning, fontSize: 12),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _LocationCheckboxTile extends StatelessWidget {
  const _LocationCheckboxTile({
    required this.location,
    required this.checked,
    required this.readOnly,
    required this.onChanged,
  });

  final BusinessBranchLocation location;
  final bool checked;
  final bool readOnly;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final locale = Localizations.localeOf(context).languageCode;
    final city = location.displayCityName(localeCode: locale);
    final label = location.isPrimary
        ? '$city, ${location.address} · ${l10n.ownerLocationPrimaryBadge}'
        : '$city, ${location.address}';

    return CheckboxListTile(
      contentPadding: EdgeInsets.zero,
      controlAffinity: ListTileControlAffinity.leading,
      value: checked,
      onChanged: readOnly ? null : (v) => onChanged(v ?? false),
      title: Text(label, style: const TextStyle(fontSize: 14)),
    );
  }
}

String branchAvailabilityValidationMessage(
  AppLocalizations l10n,
  BranchAvailabilityValidationReason reason,
) {
  switch (reason) {
    case BranchAvailabilityValidationReason.ok:
      return '';
    case BranchAvailabilityValidationReason.noBranches:
      return l10n.ownerBranchAvailabilityAddBranchFirst;
    case BranchAvailabilityValidationReason.selectAtLeastOne:
      return l10n.ownerBranchAvailabilitySelectAtLeastOne;
    case BranchAvailabilityValidationReason.missingUnresolved:
      return l10n.ownerBranchAvailabilityMissingUnresolved;
  }
}
