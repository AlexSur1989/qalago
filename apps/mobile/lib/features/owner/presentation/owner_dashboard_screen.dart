import 'package:flutter/material.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/rbac/business_access.dart';
import '../../../shared/navigation/business_traffic_source.dart';
import '../../../shared/navigation/open_business.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_utils.dart';
import '../utils/owner_l10n.dart';
import '../providers/owner_providers.dart';
import 'widgets/owner_scaffold.dart';
import 'widgets/owner_views_chart.dart';

const _kpiKeys = [
  'VIEW_BUSINESS',
  'CALL_CLICK',
  'WHATSAPP_CLICK',
  'ROUTE_CLICK',
  'FAVORITE_ADD',
];

class OwnerDashboardScreen extends ConsumerWidget {
  const OwnerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final businessesAsync = ref.watch(myBusinessesProvider);
    final selected = ref.watch(ownerSelectedBusinessProvider);

    return OwnerScaffold(
      title: context.l10n.ownerDashboardTitle,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/owner/create-business'),
        label: Text(context.l10n.ownerAddBusiness),
        icon: const Icon(Icons.add_business),
      ),
      body: businessesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(myBusinessEntriesProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return _EmptyOwnerState(
              onRegister: () => context.push('/owner/create-business'),
            );
          }

          final business = selected ?? items.first;
          final businessId = business['id'] as String;
          final model = BusinessModel.fromJson(business);
          final encodedTitle = Uri.encodeComponent(model.title);
          final dashboardAsync = ref.watch(ownerDashboardProvider(businessId));

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(ownerDashboardProvider(businessId));
              ref.invalidate(myBusinessEntriesProvider);
            },
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.screen),
              children: [
                if (items.length > 1) ...[
                  DropdownButtonFormField<String>(
                    value: businessId,
                    decoration: InputDecoration(labelText: context.l10n.ownerBusinessSection),
                    items: items
                        .map(
                          (b) => DropdownMenuItem(
                            value: b['id'] as String,
                            child: Text(b['title'] as String? ?? ''),
                          ),
                        )
                        .toList(),
                    onChanged: (id) {
                      if (id != null) {
                        onOwnerBusinessSelected(ref, id);
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                ],
                Text(
                  'Добро пожаловать, ${model.title}!',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${ownerBusinessStatusLabel(context.l10n, business['status'] as String? ?? '')} · ${model.address}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textMuted,
                      ),
                ),
                const SizedBox(height: 16),
                dashboardAsync.when(
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (e, _) => ErrorView(
                    message: '$e',
                    onRetry: () => ref.invalidate(ownerDashboardProvider(businessId)),
                  ),
                  data: (data) => _DashboardContent(
                    business: business,
                    businessId: businessId,
                    encodedTitle: encodedTitle,
                    data: data,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _EmptyOwnerState extends StatelessWidget {
  const _EmptyOwnerState({required this.onRegister});

  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.screen),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.storefront_outlined, size: 64, color: AppTheme.textMuted),
            const SizedBox(height: 16),
            Text(                context.l10n.ownerNoBusinessesTitle,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(                context.l10n.ownerNoBusinessesBody,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onRegister,
              icon: const Icon(Icons.add_business),
              label: Text(context.l10n.ownerRegisterBusiness),
            ),
          ],
        ),
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({
    required this.business,
    required this.businessId,
    required this.encodedTitle,
    required this.data,
  });

  final Map<String, dynamic> business;
  final String businessId;
  final String encodedTitle;
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final summary7 = data['summary7'] as Map<String, dynamic>;
    final prevByType = data['prevByType'] as Map<String, int>;
    final byType7 = ownerByType(summary7);
    final trendsRaw = data['trends'] as Map<String, dynamic>;
    final trendsAvailable = data['trendsAvailable'] as bool? ?? true;
    final trendItems = aggregateViewTrends(trendsRaw['items'] as List<dynamic>? ?? []);
    final activePromotions = data['activePromotions'] as List<PromotionModel>;
    final plan = data['plan'] as Map<String, dynamic>;
    final catalog = plan['catalog'] as Map<String, dynamic>? ?? {};
    final limits = plan['limits'] as Map<String, dynamic>? ?? {};
    final usage = plan['usage'] as Map<String, dynamic>? ?? {};
    final entitlements = plan['entitlements'] as Map<String, dynamic>? ?? {};
    final maxPhotos = limits['maxPhotos'] as int?;
    final maxServiceItems = limits['maxServiceItems'] as int?;
    final feedHint = ownerPromotionFeedHint(context.l10n);
    final completion = ownerProfileCompletion(business);
    final totalActions = (summary7['total'] as num?)?.toInt() ?? 0;
    final views = byType7['VIEW_BUSINESS'] ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '$views просмотров · $totalActions действий за 7 дней',
          style: TextStyle(color: AppTheme.textMuted),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 110,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _kpiKeys.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final key = _kpiKeys[i];
              final label = ownerKpiLabel(context.l10n, key);
              final current = byType7[key] ?? 0;
              final previous = prevByType[key] ?? 0;
              final delta = ownerFormatDelta(current, previous);
              return SizedBox(
                width: 132,
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(label, style: Theme.of(context).textTheme.labelSmall),
                        const Spacer(),
                        Text(
                          ownerFormatNumber(current),
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        if (delta != null)
                          Text(
                            '$delta за нед.',
                            style: TextStyle(
                              fontSize: 11,
                              color: current > previous
                                  ? AppTheme.openStatus
                                  : AppTheme.textMuted,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(                context.l10n.ownerViewsChartTitle,
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                if (!trendsAvailable)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text(
                      context.l10n.ownerTrendsLockedHint,
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                  ),
                OwnerViewsChart(items: trendItems),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(                context.l10n.ownerPlanUsageTitle,
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  'Фото: ${usage['photos'] ?? 0}${maxPhotos != null ? ' / $maxPhotos' : ''}'
                  '${entitlements['photos']?['overLimit'] == true ? ' (опубл. ${entitlements['photos']?['published']})' : ''}'
                  '\nТовары и услуги: ${usage['serviceItems'] ?? 0}${maxServiceItems != null ? ' / $maxServiceItems' : ''}'
                  '\nАктивные акции: ${usage['activePromotions'] ?? 0} / ${limits['maxActivePromotions'] ?? 1}',
                  style: TextStyle(color: AppTheme.textMuted),
                ),
                if (entitlements['overLimitNotice'] != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    entitlements['overLimitNotice'] as String,
                    style: TextStyle(color: AppSemanticColors.warning, fontSize: 13),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _SideCard(
                title: context.l10n.ownerProfileCard,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(context.l10n.ownerProfileCompletion(completion)),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(value: completion / 100),
                    const SizedBox(height: 10),
                    OutlinedButton(
                      onPressed: () => context.push(
                        '/owner/edit/$businessId?title=$encodedTitle',
                      ),
                      child: Text(context.l10n.ownerFillProfile),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _SideCard(
                title: context.l10n.ownerPlanTitle,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      catalog['nameRu'] as String? ?? 'Базовый',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: () => context.push('/owner/plan'),
                      child: Text(context.l10n.ownerUpgradePlan),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(                context.l10n.ownerActivePromotions,
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextButton(
                      onPressed: () => context.push(
                        '/owner/promotions/$businessId?title=$encodedTitle',
                      ),
                      child: Text(context.l10n.commonAll),
                    ),
                  ],
                ),
                if (activePromotions.isEmpty)
                  Text(context.l10n.ownerNoActivePromotions, style: TextStyle(color: AppTheme.textMuted))
                else ...[
                  Text(
                    feedHint,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textMuted,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...activePromotions.take(3).map(
                        (p) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(p.title),
                          subtitle: Text(
                            [
                              if (p.discountText != null && p.discountText!.isNotEmpty)
                                p.discountText!,
                              ownerPromotionStatusLabelForModel(context.l10n, p),
                            ].join(' · '),
                          ),
                        ),
                      ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          color: AppTheme.kzBlue.withValues(alpha: 0.08),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(                context.l10n.ownerMonetizationTitle,
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                ),
                const SizedBox(height: 6),
                Text(
                  context.l10n.ownerPromoteCatalogSubtitle,
                  style: TextStyle(color: AppTheme.textMuted),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () => context.push('/owner/promote'),
                  child: Text(context.l10n.ownerOpenCatalog),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => context.push('/owner/monetization/campaigns'),
                  child: Text(context.l10n.ownerMyCampaigns),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(                context.l10n.ownerManagementSection,
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
        ),
        const SizedBox(height: 10),
        _ManagementGrid(businessId: businessId, encodedTitle: encodedTitle),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => openBusiness(
                context,
                businessId,
                BusinessTrafficSource.direct,
              ),
          icon: const Icon(Icons.visibility_outlined),
          label: Text(context.l10n.ownerPreviewCard),
        ),
      ],
    );
  }
}

class _SideCard extends StatelessWidget {
  const _SideCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            child,
          ],
        ),
      ),
    );
  }
}

class _ManagementGrid extends ConsumerWidget {
  const _ManagementGrid({
    required this.businessId,
    required this.encodedTitle,
  });

  final String businessId;
  final String encodedTitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final access = ref.watch(selectedBusinessAccessProvider);
    final items = [
      (Icons.storefront_outlined, context.l10n.ownerMgmtMyBusiness, '/owner/edit/$businessId?title=$encodedTitle'),
      (Icons.restaurant_menu, context.l10n.ownerPermissionCatalogEdit, '/owner/menu/$businessId?title=$encodedTitle'),
      (Icons.photo_library_outlined, context.l10n.ownerGallery, '/owner/gallery/$businessId?title=$encodedTitle'),
      (Icons.local_offer_outlined, context.l10n.ownerMgmtPromotions, '/owner/promotions/$businessId?title=$encodedTitle'),
      (Icons.star_outline, context.l10n.ownerMgmtReviews, '/owner/reviews/$businessId?title=$encodedTitle'),
      (Icons.bar_chart_outlined, context.l10n.ownerAnalyticsTitle, '/owner/analytics/$businessId?title=$encodedTitle'),
      if (access != null && isOwner(access))
        (Icons.groups_outlined, context.l10n.ownerNavTeam, '/owner/team'),
    ];

    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 1.05,
      children: items
          .map(
            (item) => OutlinedButton(
              onPressed: () => context.push(item.$3),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.all(8),
                alignment: Alignment.center,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(item.$1, color: AppTheme.kzBlue),
                  const SizedBox(height: 6),
                  Text(
                    item.$2,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}
