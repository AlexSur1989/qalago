import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
import '../../../l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/rbac/business_access.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_plan_errors.dart';
import '../owner_plan_ui.dart';
import '../providers/owner_providers.dart';
import '../utils/owner_l10n.dart';
import 'widgets/owner_scaffold.dart';

String _catalogTierName(
  List<Map<String, dynamic>> catalog,
  String tier,
  AppLocalizations l10n,
) {
  for (final c in catalog) {
    if (c['tier'] == tier) {
      return c['nameRu'] as String? ?? ownerPlanTierLabel(l10n, tier);
    }
  }
  return ownerPlanTierLabel(l10n, tier);
}

class OwnerPlanScreen extends ConsumerStatefulWidget {
  const OwnerPlanScreen({super.key});

  @override
  ConsumerState<OwnerPlanScreen> createState() => _OwnerPlanScreenState();
}

class _OwnerPlanScreenState extends ConsumerState<OwnerPlanScreen> {
  String? _checkoutTier;
  String? _bannerMessage;
  final _purchaseAttempt = PlanPurchaseAttemptTracker();

  String _formatPrice(int price) {
    if (price == 0) return '0 ₸';
    final formatted = NumberFormat.decimalPattern('ru').format(price);
    return '$formatted ₸';
  }

  String _formatAmount(int amountKzt) {
    return NumberFormat.decimalPattern('ru').format(amountKzt);
  }

  String _periodLabel(AppLocalizations l10n, int? periodDays) {
    if (periodDays == null) return l10n.ownerPlanPeriodMonth;
    return l10n.ownerPlanPeriodDays(periodDays);
  }

  String _formatDate(DateTime date) {
    return DateFormat.yMMMd().format(date.toLocal());
  }

  Future<void> _refresh(String businessId) async {
    ref.invalidate(businessPlanProvider(businessId));
    ref.invalidate(businessPlanPaymentsProvider(businessId));
    ref.invalidate(ownerDashboardProvider(businessId));
    await Future.wait([
      ref.read(businessPlanProvider(businessId).future),
      ref.read(businessPlanPaymentsProvider(businessId).future),
    ]);
  }

  Future<void> _checkout(String businessId, String tier) async {
    final l10n = context.l10n;
    final access = ref.read(ownerBusinessAccessProvider(businessId));
    if (access == null || !isOwner(access)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.ownerPlanOwnerOnlyPurchase)),
      );
      return;
    }

    setState(() {
      _checkoutTier = tier;
      _bannerMessage = null;
    });
    try {
      final repo = ref.read(catalogRepositoryProvider);
      if (AppConstants.mockPlanCheckoutEnabled) {
        final result = await repo.mockPlanCheckout(businessId, tier);
        _purchaseAttempt.clear();
        setState(() => _bannerMessage = result['message'] as String?);
      } else {
        final idempotencyKey = _purchaseAttempt.begin(businessId, tier);
        await repo.createPlanPurchase(
          businessId,
          tier,
          idempotencyKey: idempotencyKey,
        );
        _purchaseAttempt.clear();
        setState(() => _bannerMessage = l10n.ownerPlanPurchasePendingSuccess);
      }
      await _refresh(businessId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_bannerMessage ?? l10n.ownerPlanUpdated),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapOwnerPlanPurchaseError(l10n, e))),
        );
      }
    } finally {
      if (mounted) setState(() => _checkoutTier = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final business = ref.watch(ownerSelectedBusinessProvider);

    if (business == null) {
      return OwnerScaffold(
        title: l10n.ownerPlanTitle,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(l10n.ownerRegisterBusinessFirst),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => context.push('/owner/create-business'),
                child: Text(l10n.ownerRegister),
              ),
            ],
          ),
        ),
      );
    }

    final businessId = business['id'] as String;
    final access = ref.watch(ownerBusinessAccessProvider(businessId));
    final canManagePlan = access != null && isOwner(access);
    final catalogAsync = ref.watch(plansCatalogProvider);
    final planAsync = ref.watch(businessPlanProvider(businessId));
    final paymentsAsync = ref.watch(businessPlanPaymentsProvider(businessId));

    return OwnerScaffold(
      title: l10n.ownerPlanTitle,
      body: catalogAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: mapOwnerPlanPurchaseError(l10n, e),
          onRetry: () => ref.invalidate(plansCatalogProvider),
        ),
        data: (catalog) => planAsync.when(
          loading: () => const LoadingView(),
          error: (e, _) => ErrorView(
            message: mapOwnerPlanPurchaseError(l10n, e),
            onRetry: () => _refresh(businessId),
          ),
          data: (planStatus) => paymentsAsync.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(
              message: mapOwnerPlanPurchaseError(l10n, e),
              onRetry: () => ref.invalidate(businessPlanPaymentsProvider(businessId)),
            ),
            data: (payments) {
              final effectiveTier = BusinessModel.normalizePlanTier(
                planStatus['effectiveTier'] as String?,
              );
              final pending = findPendingPlanPayment(payments);
              final hasPending = pending != null;

              return RefreshIndicator(
                onRefresh: () => _refresh(businessId),
                child: ListView(
                  padding: const EdgeInsets.all(AppSpacing.screen),
                  children: [
                    if (_bannerMessage != null)
                      Card(
                        color: AppTheme.openStatusBg,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text(_bannerMessage!),
                        ),
                      ),
                    Text(
                      l10n.ownerPlanRefreshHint,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.textMuted,
                          ),
                    ),
                    const SizedBox(height: 12),
                    if (pending != null) _PendingPaymentCard(
                      payment: pending,
                      catalog: catalog,
                      formatAmount: _formatAmount,
                    ),
                    _CurrentPlanCard(
                      planStatus: planStatus,
                      formatDate: _formatDate,
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.campaign_outlined, color: AppTheme.kzBlue),
                        title: Text(l10n.ownerMonetizationTitle),
                        subtitle: Text(l10n.ownerPlanPromoteSubtitle),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/owner/promote'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...catalog.map((plan) {
                      final tier = BusinessModel.normalizePlanTier(plan['tier'] as String?);
                      final isCurrent = effectiveTier == tier;
                      final price = (plan['priceKzt'] as num?)?.toInt() ?? 0;
                      final periodDays = plan['periodDays'] as int?;
                      final features = (plan['features'] as List<dynamic>? ?? [])
                          .cast<String>();
                      final canPurchase = canOfferPlanPurchase(
                        effectiveTier: effectiveTier,
                        targetTier: tier,
                        hasPendingPayment: hasPending,
                      );
                      final actionKind = planPurchaseActionKind(effectiveTier, tier);
                      final lowerPaid = isLowerPaidPlanTier(tier, effectiveTier);
                      final sameTierRenew = isSameTierRenewal(tier, effectiveTier);
                      final tierName = plan['nameRu'] as String? ??
                          ownerPlanTierLabel(l10n, tier);

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(
                            color: isCurrent ? AppTheme.kzBlue : AppTheme.borderSubtle,
                            width: isCurrent ? 2 : 1,
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (isCurrent)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.kzBlue.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    l10n.ownerPlanCurrentBadge,
                                    style: const TextStyle(
                                      color: AppTheme.kzBlue,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              if (isCurrent) const SizedBox(height: 8),
                              Text(
                                tierName,
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              Text(
                                '${_formatPrice(price)} / ${_periodLabel(l10n, periodDays)}',
                                style: TextStyle(color: AppTheme.textMuted),
                              ),
                              if (sameTierRenew) ...[
                                const SizedBox(height: 8),
                                Text(
                                  l10n.ownerPlanSameTierRenewalHint,
                                  style: TextStyle(
                                    color: AppTheme.textMuted,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 10),
                              ...features.map(
                                (f) => Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('• '),
                                      Expanded(child: Text(f)),
                                    ],
                                  ),
                                ),
                              ),
                              if (tier == 'VIP') ...[
                                const SizedBox(height: 8),
                                Text(
                                  l10n.ownerPlanVipAdsSeparate,
                                  style: TextStyle(
                                    color: AppTheme.textMuted,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 12),
                              if (isCurrent && tier == 'FREE')
                                OutlinedButton(
                                  onPressed: null,
                                  child: Text(l10n.ownerMembershipStatusActive),
                                )
                              else if (!canManagePlan)
                                OutlinedButton(
                                  onPressed: null,
                                  child: Text(l10n.ownerPlanOwnerOnlyPurchase),
                                )
                              else if (isCurrent && tier != 'FREE')
                                OutlinedButton(
                                  onPressed: null,
                                  child: Text(l10n.ownerMembershipStatusActive),
                                )
                              else
                                FilledButton(
                                  onPressed: _checkoutTier == tier || !canPurchase
                                      ? null
                                      : () => _checkout(businessId, tier),
                                  child: Text(
                                    _checkoutTier == tier
                                        ? l10n.ownerPlanConnecting
                                        : !canPurchase && lowerPaid
                                            ? l10n.ownerPlanDowngradeNotAllowed
                                            : !canPurchase
                                                ? l10n.ownerPlanPendingPaymentTitle
                                                : AppConstants.mockPlanCheckoutEnabled
                                                    ? l10n.ownerPlanMockCheckoutLabel
                                                    : ownerPlanPurchaseActionLabel(
                                                        l10n,
                                                        actionKind,
                                                      ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    }),
                    _PlanHistorySection(
                      payments: payments,
                      catalog: catalog,
                      formatPrice: _formatPrice,
                      formatDate: _formatDate,
                    ),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.ownerPlanAdsSectionTitle,
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              l10n.ownerPlanAdsSectionBody,
                              style: TextStyle(color: AppTheme.textMuted),
                            ),
                            const SizedBox(height: 10),
                            OutlinedButton(
                              onPressed: () => context.push('/owner/promote'),
                              child: Text(l10n.ownerPlanGoToAds),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (AppConstants.mockPlanCheckoutEnabled)
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                l10n.ownerPlanMockSectionTitle,
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                l10n.ownerPlanMockSectionBody,
                                style: TextStyle(color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _PendingPaymentCard extends StatelessWidget {
  const _PendingPaymentCard({
    required this.payment,
    required this.catalog,
    required this.formatAmount,
  });

  final Map<String, dynamic> payment;
  final List<Map<String, dynamic>> catalog;
  final String Function(int) formatAmount;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final tier = payment['tier'] as String? ?? '';
    final tierName = _catalogTierName(catalog, tier, l10n);
    final amount = (payment['amountKzt'] as num?)?.toInt() ?? 0;
    final createdAt = payment['createdAt'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: AppTheme.openStatusBg,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.ownerPlanPendingPaymentTitle,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.ownerPlanPendingPaymentBody(tierName, formatAmount(amount)),
            ),
            if (createdAt != null) ...[
              const SizedBox(height: 8),
              Text(
                DateFormat.yMMMd().add_Hm().format(DateTime.parse(createdAt).toLocal()),
                style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _CurrentPlanCard extends StatelessWidget {
  const _CurrentPlanCard({
    required this.planStatus,
    required this.formatDate,
  });

  final Map<String, dynamic> planStatus;
  final String Function(DateTime) formatDate;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final catalogInfo = planStatus['catalog'] as Map<String, dynamic>? ?? {};
    final limits = planStatus['limits'] as Map<String, dynamic>? ?? {};
    final usage = planStatus['usage'] as Map<String, dynamic>? ?? {};
    final entitlements = planStatus['entitlements'] as Map<String, dynamic>? ?? {};
    final effectiveTier = BusinessModel.normalizePlanTier(
      planStatus['effectiveTier'] as String?,
    );
    final maxPhotos = limits['maxPhotos'] as int?;
    final maxServiceItems = limits['maxServiceItems'] as int?;
    final adDiscount = limits['advertisingDiscountPercent'] as num?;
    final expiresAt = planStatus['expiresAt'] as String?;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.ownerPlanCurrent(
                catalogInfo['nameRu'] as String? ??
                    ownerPlanTierLabel(l10n, effectiveTier),
              ),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
            ),
            const SizedBox(height: 8),
            Text(
              '${l10n.ownerPlanUsageTitle}: '
              '${usage['photos'] ?? 0}${maxPhotos != null ? ' / $maxPhotos' : ''}'
              ' · ${usage['serviceItems'] ?? 0}${maxServiceItems != null ? ' / $maxServiceItems' : ''}'
              ' · ${usage['activePromotions'] ?? 0} / ${limits['maxActivePromotions'] ?? 1}',
              style: TextStyle(color: AppTheme.textMuted),
            ),
            if (entitlements['overLimitNotice'] != null) ...[
              const SizedBox(height: 8),
              Text(
                entitlements['overLimitNotice'] as String,
                style: TextStyle(color: AppSemanticColors.warning, fontSize: 13),
              ),
            ],
            if (expiresAt != null) ...[
              const SizedBox(height: 4),
              Text(
                l10n.ownerPlanActiveUntil(
                  formatDate(DateTime.parse(expiresAt).toLocal()),
                ),
                style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
            ],
            if (adDiscount != null && adDiscount > 0) ...[
              const SizedBox(height: 4),
              Text(
                l10n.ownerPlanAdDiscount(adDiscount.round()),
                style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PlanHistorySection extends StatelessWidget {
  const _PlanHistorySection({
    required this.payments,
    required this.catalog,
    required this.formatPrice,
    required this.formatDate,
  });

  final List<Map<String, dynamic>> payments;
  final List<Map<String, dynamic>> catalog;
  final String Function(int) formatPrice;
  final String Function(DateTime) formatDate;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.ownerPlanPaymentHistoryTitle,
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            if (payments.isEmpty)
              Text(l10n.ownerPlanPaymentHistoryEmpty, style: TextStyle(color: AppTheme.textMuted))
            else
              ...payments.map((p) {
                final tier = p['tier'] as String? ?? '';
                final tierName = _catalogTierName(catalog, tier, l10n);
                final amount = (p['amountKzt'] as num?)?.toInt() ?? 0;
                final paidAt = p['paidAt'] as String?;
                final status = p['status'] as String? ?? '';
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    '$tierName — ${formatPrice(amount)} · '
                    '${paidAt != null ? formatDate(DateTime.parse(paidAt).toLocal()) : l10n.ownerPlanPaymentAwaitingConfirmation}'
                    ' · ${ownerPlanPaymentStatusLabel(l10n, status)}',
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
