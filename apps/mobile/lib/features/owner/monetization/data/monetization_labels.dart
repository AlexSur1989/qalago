import '../../../../l10n/app_localizations.dart';
import '../../utils/owner_l10n.dart' as owner_l10n;

/// Canonical monetization product codes (backend identifiers unchanged).
const monetizationProductCodes = {
  'BOOST',
  'TOP_CATEGORY',
  'PROMOTED_PROMOTION',
  'FEATURED_BUSINESS',
  'VIP_BANNER',
};

String productTitle(AppLocalizations l10n, String code) =>
    owner_l10n.monetizationProductTitle(l10n, code);

String productDescription(AppLocalizations l10n, String code) =>
    owner_l10n.monetizationProductDescription(l10n, code);

String productTopCategoryNote(AppLocalizations l10n) =>
    l10n.monetizationProductTopCategoryNote;

String orderStatusLabel(AppLocalizations l10n, String status) =>
    owner_l10n.monetizationOrderStatusLabel(l10n, status);

String campaignStatusLabel(AppLocalizations l10n, String status) =>
    owner_l10n.monetizationCampaignStatusLabel(l10n, status);

String creativeModerationLabel(AppLocalizations l10n, String status) =>
    owner_l10n.monetizationCreativeModerationLabel(l10n, status);

String analyticsActionLabel(AppLocalizations l10n, String type) =>
    owner_l10n.monetizationAnalyticsActionLabel(l10n, type);

String vipModerationNotice(AppLocalizations l10n) =>
    l10n.monetizationVipModerationNotice;

String packageVipNotice(AppLocalizations l10n) => l10n.monetizationPackageVipNotice;

String packageVipCta(AppLocalizations l10n) => l10n.monetizationPackageVipCta;

String paymentInfoNotice(AppLocalizations l10n) => l10n.monetizationPaymentInfoNotice;

String paymentMethodUnavailableNotice(AppLocalizations l10n) =>
    l10n.monetizationPaymentMethodUnavailable;

String ctrTooltip(AppLocalizations l10n) => l10n.monetizationCtrTooltip;

String purchaseStateLabel(AppLocalizations l10n, String state) =>
    owner_l10n.monetizationPurchaseStateLabel(l10n, state);

String purchasePrimaryActionLabel(AppLocalizations l10n, String action) =>
    owner_l10n.monetizationPurchasePrimaryActionLabel(l10n, action);

String monetizationReasonMessage(AppLocalizations l10n, String? code) =>
    owner_l10n.monetizationReasonMessage(l10n, code);
