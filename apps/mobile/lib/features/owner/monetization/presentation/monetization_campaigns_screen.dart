import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../owner_utils.dart';
import '../../presentation/widgets/owner_scaffold.dart';
import '../../providers/owner_providers.dart';
import '../data/monetization_formatters.dart';
import '../data/monetization_labels.dart';
import '../data/monetization_models.dart';
import '../providers/monetization_providers.dart';
import '../widgets/monetization_widgets.dart';

class MonetizationCampaignsScreen extends ConsumerWidget {
  const MonetizationCampaignsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = ref.watch(ownerSelectedBusinessProvider);
    if (business == null) {
      return const OwnerScaffold(
        title: 'Мои продвижения',
        body: Center(child: Text('Заведение не выбрано')),
      );
    }
    final businessId = business['id'] as String;
    final campaignsAsync =
        ref.watch(ownerMonetizationCampaignsProvider(businessId));

    return OwnerScaffold(
      title: 'Мои продвижения',
      body: campaignsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: 'Не удалось загрузить продвижения.',
          onRetry: () =>
              ref.invalidate(ownerMonetizationCampaignsProvider(businessId)),
        ),
        data: (campaigns) {
          if (campaigns.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => ref.invalidate(
                ownerMonetizationCampaignsProvider(businessId),
              ),
              child: ListView(
                children: const [
                  SizedBox(height: 120),
                  Center(child: Text('Нет активных продвижений')),
                ],
              ),
            );
          }

          final groups = _groupCampaigns(campaigns);
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(
              ownerMonetizationCampaignsProvider(businessId),
            ),
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.screen),
              children: [
                for (final entry in groups.entries) ...[
                  Text(
                    entry.key,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  ...entry.value.map(
                    (c) => _CampaignCard(
                      campaign: c,
                      onTap: () => context.push(
                        '/owner/monetization/campaigns/${c.id}',
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Map<String, List<MonetizationCampaign>> _groupCampaigns(
    List<MonetizationCampaign> campaigns,
  ) {
    final active = <MonetizationCampaign>[];
    final scheduled = <MonetizationCampaign>[];
    final moderation = <MonetizationCampaign>[];
    final completed = <MonetizationCampaign>[];
    final other = <MonetizationCampaign>[];

    for (final c in campaigns) {
      switch (c.displayStatus) {
        case 'ACTIVE':
          active.add(c);
        case 'SCHEDULED':
          scheduled.add(c);
        case 'PENDING_MODERATION':
          moderation.add(c);
        case 'COMPLETED':
          completed.add(c);
        default:
          other.add(c);
      }
    }

    final result = <String, List<MonetizationCampaign>>{};
    if (active.isNotEmpty) result['Активные'] = active;
    if (scheduled.isNotEmpty) result['Запланированные'] = scheduled;
    if (moderation.isNotEmpty) result['На модерации'] = moderation;
    if (completed.isNotEmpty) result['Завершённые'] = completed;
    if (other.isNotEmpty) result['Другие'] = other;
    return result;
  }
}

class _CampaignCard extends StatelessWidget {
  const _CampaignCard({required this.campaign, required this.onTap});

  final MonetizationCampaign campaign;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final status = campaign.displayStatus;
    final daysLeft = campaign.endAt == null
        ? null
        : campaign.endAt!.difference(DateTime.now()).inDays;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MonetizationStatusChip(
                label: campaignStatusLabel(status),
                color: campaignStatusColor(status),
              ),
              const SizedBox(height: 10),
              Text(
                productTitle(campaign.productCode),
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
              if (campaign.businessTitle != null) ...[
                const SizedBox(height: 4),
                Text(campaign.businessTitle!,
                    style: TextStyle(color: Colors.grey.shade700)),
              ],
              const SizedBox(height: 8),
              Text(formatMonetizationDateRange(campaign.startAt, campaign.endAt)),
              if (daysLeft != null && daysLeft >= 0 && status == 'ACTIVE')
                Text('Осталось $daysLeft ${_daysWord(daysLeft)}'),
              const SizedBox(height: 10),
              Text(
                'Показы: ${ownerFormatNumber(campaign.metrics.servedCount)} · '
                'Просмотры: ${ownerFormatNumber(campaign.metrics.qualifiedImpressions)} · '
                'Переходы: ${ownerFormatNumber(campaign.metrics.clickCount)}',
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _daysWord(int n) {
    final mod10 = n % 10;
    if (mod10 == 1 && n % 100 != 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
      return 'дня';
    }
    return 'дней';
  }
}

class MonetizationCampaignDetailScreen extends ConsumerWidget {
  const MonetizationCampaignDetailScreen({super.key, required this.campaignId});

  final String campaignId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final campaignAsync = ref.watch(ownerMonetizationCampaignProvider(campaignId));
    final analyticsAsync = ref.watch(campaignAnalyticsProvider(campaignId));

    return OwnerScaffold(
      title: 'Статистика',
      body: campaignAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: 'Кампания не найдена.',
          onRetry: () =>
              ref.invalidate(ownerMonetizationCampaignProvider(campaignId)),
        ),
        data: (campaign) {
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(ownerMonetizationCampaignProvider(campaignId));
              ref.invalidate(campaignAnalyticsProvider(campaignId));
            },
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.screen),
              children: [
                Text(
                  productTitle(campaign.productCode),
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
                ),
                const SizedBox(height: 8),
                MonetizationStatusChip(
                  label: campaignStatusLabel(campaign.displayStatus),
                  color: campaignStatusColor(campaign.displayStatus),
                ),
                const SizedBox(height: 16),
                Text(
                  'Период: ${formatMonetizationDateRange(campaign.startAt, campaign.endAt)}',
                ),
                const SizedBox(height: 24),
                analyticsAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (e, _) => const Text('Не удалось загрузить статистику.'),
                  data: (analytics) => _AnalyticsBody(analytics: analytics),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _AnalyticsBody extends StatelessWidget {
  const _AnalyticsBody({required this.analytics});

  final MonetizationCampaignAnalytics analytics;

  @override
  Widget build(BuildContext context) {
    final empty = analytics.qualifiedImpressions == 0 && analytics.clicks == 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Статистика', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
        if (empty) ...[
          const SizedBox(height: 8),
          Text(
            'Статистика появится после начала показов.',
            style: TextStyle(color: Colors.grey.shade700),
          ),
        ],
        const SizedBox(height: 16),
        _metricTile('Просмотры', ownerFormatNumber(analytics.qualifiedImpressions)),
        _metricTile('Переходы', ownerFormatNumber(analytics.clicks)),
        Row(
          children: [
            Expanded(child: _metricTile('CTR', '${analytics.ctr}%')),
            IconButton(
              icon: const Icon(Icons.info_outline, size: 20),
              onPressed: () {
                showDialog<void>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('CTR'),
                    content: const Text(ctrTooltip),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Понятно'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
        if (analytics.actions.isNotEmpty) ...[
          const SizedBox(height: 20),
          const Text('Действия', style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          ...analytics.actions.entries
              .where((e) => e.value > 0)
              .map(
                (e) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(analyticsActionLabel(e.key)),
                  trailing: Text(ownerFormatNumber(e.value)),
                ),
              ),
        ],
      ],
    );
  }

  Widget _metricTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 16)),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}
