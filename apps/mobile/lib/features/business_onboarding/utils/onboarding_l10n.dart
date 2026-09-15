import '../../../l10n/app_localizations.dart';

String onboardingApplicationStatusLabel(AppLocalizations l10n, String status) {
  return switch (status.toUpperCase()) {
    'DRAFT' => l10n.onboardingStatusDraft,
    'PENDING' => l10n.onboardingStatusPending,
    'APPROVED' => l10n.onboardingStatusApproved,
    'REJECTED' => l10n.onboardingStatusRejected,
    'CANCELLED' => l10n.onboardingStatusCancelled,
    _ => status,
  };
}

String onboardingClaimStatusLabel(AppLocalizations l10n, String status) {
  return switch (status.toUpperCase()) {
    'PENDING' => l10n.onboardingStatusPending,
    'APPROVED' => l10n.onboardingStatusApproved,
    'REJECTED' => l10n.onboardingStatusRejected,
    'CANCELLED' => l10n.onboardingStatusCancelled,
    _ => status,
  };
}

String membershipRoleLabelL10n(AppLocalizations l10n, String role) {
  return switch (role.toUpperCase()) {
    'OWNER' => l10n.onboardingRoleOwner,
    'MANAGER' => l10n.onboardingRoleManager,
    _ => role,
  };
}

String localizedOnboardingError(AppLocalizations l10n, Object error) {
  final raw = error.toString().toLowerCase();
  if (raw.contains('409') || raw.contains('conflict')) {
    return l10n.onboardingErrorConflict;
  }
  if (raw.contains('duplicate') || raw.contains('already exists')) {
    return l10n.onboardingErrorDuplicate;
  }
  if (raw.contains('already owner') || raw.contains('owner')) {
    return l10n.onboardingErrorAlreadyOwner;
  }
  if (raw.contains('403') || raw.contains('forbidden')) {
    return l10n.onboardingErrorForbidden;
  }
  return l10n.onboardingErrorGeneric;
}
