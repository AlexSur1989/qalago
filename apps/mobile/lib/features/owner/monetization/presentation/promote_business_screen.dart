import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/models/models.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../presentation/widgets/owner_scaffold.dart';
import '../../providers/owner_providers.dart';
import '../../utils/owner_l10n.dart';
import '../data/owner_monetization_hub.dart';
import '../providers/monetization_providers.dart';
import '../widgets/monetization_widgets.dart';

class PromoteBusinessScreen extends ConsumerStatefulWidget {
  const PromoteBusinessScreen({super.key});

  @override
  ConsumerState<PromoteBusinessScreen> createState() =>
      _PromoteBusinessScreenState();
}

class _PromoteBusinessScreenState extends ConsumerState<PromoteBusinessScreen> {
  MonetizationPromoteSubject _subject = MonetizationPromoteSubject.business;

  Future<void> _refresh(String businessId) async {
    invalidateOwnerMonetization(ref, businessId);
    ref.invalidate(businessPlanProvider(businessId));
    ref.invalidate(businessPlanPaymentsProvider(businessId));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final business = ref.watch(ownerSelectedBusinessProvider);
    if (business == null) {
      return OwnerScaffold(
        title: l10n.ownerMonetizationTitle,
        body: Center(child: Text(l10n.ownerSelectBusinessFirst)),
      );
    }

    final businessId = business['id'] as String;
    final categoryId = business['categoryId'] as String?;
    final citySlug = business['city'] is Map
        ? (business['city'] as Map)['slug'] as String?
        : null;
    final access = ref.watch(selectedBusinessAccessProvider);
    final canViewPlan = canViewOwnerPlanOnMonetizationHub(access);
    final canAds = canManageOwnerAdvertising(access);

    if (!canViewPlan && !canAds) {
      return OwnerScaffold(
        title: l10n.ownerMonetizationTitle,
        body: Center(child: Text(l10n.ownerSelectBusinessFirst)),
      );
    }

    final productsAsync = ref.watch(
      monetizationProductsProvider((
        businessId: businessId,
        citySlug: citySlug,
        categoryId: categoryId,
      )),
    );
    final packagesAsync = ref.watch(monetizationPackagesProvider);
    final purchaseStatesAsync =
        ref.watch(monetizationPurchaseStatesProvider(businessId));
    final ordersAsync = ref.watch(ownerMonetizationOrdersProvider(businessId));
    final campaignsAsync =
        ref.watch(ownerMonetizationCampaignsProvider(businessId));
    final planAsync = canViewPlan
        ? ref.watch(businessPlanProvider(businessId))
        : const AsyncValue<Map<String, dynamic>>.data({});
    final paymentsAsync = canViewPlan
        ? ref.watch(businessPlanPaymentsProvider(businessId))
        : const AsyncValue<List<Map<String, dynamic>>>.data([]);

    return OwnerScaffold(
      title: l10n.ownerMonetizationTitle,
      body: RefreshIndicator(
        onRefresh: () => _refresh(businessId),
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.screen),
          children: [
            Text(
              l10n.ownerMonetizationHubIntro,
              style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
            ),
            if (canViewPlan) ...[
              const SizedBox(height: 20),
              _SectionHeader(
                title: l10n.ownerMyPlanSectionTitle,
                actionLabel: l10n.ownerPlanTitle,
                onAction: () => context.push('/owner/plan'),
              ),
              const SizedBox(height: 8),
              planAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => ErrorView(
                  message: l10n.ownerPriceLoadFailed,
                  onRetry: () =>
                      ref.invalidate(businessPlanProvider(businessId)),
                ),
                data: (planStatus) {
                  final payments = paymentsAsync.valueOrNull ?? [];
                  final pending = findPlanPendingPayment(payments);
                  final effectiveTier = BusinessModel.normalizePlanTier(
                    planStatus['effectiveTier'] as String?,
                  );
                  final catalogInfo =
                      planStatus['catalog'] as Map<String, dynamic>? ?? {};
                  final expiresAt = planStatus['expiresAt'] as String?;
                  final adDiscount =
                      readAdvertisingDiscountPercent(planStatus);
                  final tierLabel = catalogInfo['nameRu'] as String? ??
                      ownerPlanTierLabel(l10n, effectiveTier);

                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tierLabel,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 17,
                            ),
                          ),
                          if (expiresAt != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              l10n.ownerPlanActiveUntil(
                                DateFormat.yMMMd().format(
                                  DateTime.parse(expiresAt).toLocal(),
                                ),
                              ),
                              style: TextStyle(
                                color: AppTheme.textMuted,
                                fontSize: 13,
                              ),
                            ),
                          ],
                          if (adDiscount != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              l10n.ownerPlanAdDiscount(adDiscount),
                              style: TextStyle(
                                color: AppTheme.textMuted,
                                fontSize: 13,
                              ),
                            ),
                          ],
                          if (pending != null) ...[
                            const SizedBox(height: 12),
                            Text(
                              l10n.ownerPlanPendingPaymentTitle,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              l10n.ownerPlanPendingPaymentBody(
                                ownerPlanTierLabel(
                                  l10n,
                                  pending['tier'] as String? ?? effectiveTier,
                                ),
                                _formatKzt(
                                  (pending['amountKzt'] as num?)?.toInt() ?? 0,
                                ),
                              ),
                              style: const TextStyle(fontSize: 13),
                            ),
                          ],
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: () => context.push('/owner/plan'),
                            child: Text(l10n.ownerUpgradePlan),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
            if (canAds) ...[
              const SizedBox(height: 24),
              _SectionHeader(title: l10n.ownerAdvertisingSectionTitle),
              const SizedBox(height: 8),
              campaignsAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
                data: (campaigns) {
                  final counts = countCampaignStatuses(campaigns);
                  return Row(
                    children: [
                      _KpiChip(
                        label: l10n.ownerCampaignGroupActive,
                        value: counts.active,
                      ),
                      const SizedBox(width: 8),
                      _KpiChip(
                        label: l10n.ownerCampaignGroupScheduled,
                        value: counts.scheduled,
                      ),
                      const SizedBox(width: 8),
                      _KpiChip(
                        label: l10n.ownerCampaignGroupModeration,
                        value: counts.moderation,
                      ),
                    ],
                  );
                },
              ),
              ordersAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
                data: (orders) {
                  final pendingAds = countAdOrdersAwaitingPayment(orders);
                  if (pendingAds == 0) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Card(
                      color: AppTheme.openStatusBg,
                      child: ListTile(
                        leading: const Icon(Icons.receipt_long_outlined),
                        title: Text(l10n.ownerMonetizationAdOrdersPending(pendingAds)),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () =>
                            context.push('/owner/monetization/orders'),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
              Text(
                l10n.ownerPromoteWhatToPromote,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              SegmentedButton<MonetizationPromoteSubject>(
                segments: [
                  ButtonSegment(
                    value: MonetizationPromoteSubject.business,
                    label: Text(l10n.ownerPromoteSubjectBusiness),
                  ),
                  ButtonSegment(
                    value: MonetizationPromoteSubject.promotion,
                    label: Text(l10n.ownerPromoteSubjectPromotion),
                  ),
                ],
                selected: {_subject},
                onSelectionChanged: (next) {
                  setState(() => _subject = next.first);
                },
              ),
              const SizedBox(height: 16),
              productsAsync.when(
                loading: () => const LoadingView(),
                error: (e, _) => ErrorView(
                  message: l10n.ownerPriceLoadFailed,
                  onRetry: () => ref.invalidate(monetizationProductsProvider),
                ),
                data: (products) {
                  final filtered = filterMonetizationProductsBySubject(
                    products,
                    _subject,
                  );
                  if (filtered.isEmpty) {
                    return Text(l10n.ownerProductsUnavailable);
                  }
                  final states = purchaseStatesAsync.valueOrNull ?? {};
                  return Column(
                    children: filtered
                        .map(
                          (p) => MonetizationProductCard(
                            product: p,
                            purchaseState: states[p.code],
                            onTap: () {
                              final state = states[p.code];
                              if (state?.primaryAction == 'CONTINUE_PAYMENT' &&
                                  state?.pendingOrderId != null) {
                                context.push(
                                  '/owner/monetization/orders/${state!.pendingOrderId}',
                                );
                                return;
                              }
                              context.push('/owner/promote/${p.code}');
                            },
                          ),
                        )
                        .toList(),
                  );
                },
              ),
              const SizedBox(height: 24),
              Text(
                l10n.ownerReadyPackages,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                l10n.ownerAdPackagesNotPlansSubtitle,
                style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
              const SizedBox(height: 12),
              packagesAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => ErrorView(
                  message: l10n.ownerPackagesLoadFailed,
                  onRetry: () => ref.invalidate(monetizationPackagesProvider),
                ),
                data: (packages) => Column(
                  children: packages
                      .map(
                        (pkg) => MonetizationPackageCard(
                          package: pkg,
                          onTap: () => context.push(
                            '/owner/promote/package/${pkg.code}',
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => context.push('/owner/monetization/campaigns'),
                icon: const Icon(Icons.campaign_outlined),
                label: Text(l10n.ownerMyPromotions),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => context.push('/owner/monetization/orders'),
                icon: const Icon(Icons.receipt_long_outlined),
                label: Text(l10n.ownerMyOrders),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatKzt(int amount) {
    return NumberFormat.decimalPattern('ru').format(amount);
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
        ),
        if (actionLabel != null && onAction != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

class _KpiChip extends StatelessWidget {
  const _KpiChip({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.labelSmall),
              const SizedBox(height: 4),
              Text(
                '$value',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
