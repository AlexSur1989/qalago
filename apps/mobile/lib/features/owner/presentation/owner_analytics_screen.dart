import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../owner_analytics_utils.dart';
import '../../../core/rbac/business_access.dart';
import '../providers/owner_providers.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../utils/analytics_export_download.dart';
import 'widgets/owner_analytics_widgets.dart';

class OwnerAnalyticsScreen extends ConsumerStatefulWidget {
  const OwnerAnalyticsScreen({
    super.key,
    required this.businessId,
    required this.businessTitle,
  });

  final String businessId;
  final String businessTitle;

  @override
  ConsumerState<OwnerAnalyticsScreen> createState() => _OwnerAnalyticsScreenState();
}

class _OwnerAnalyticsScreenState extends ConsumerState<OwnerAnalyticsScreen> {
  int _days = 30;

  @override
  Widget build(BuildContext context) {
    final query = (businessId: widget.businessId, days: _days);
    final analyticsAsync = ref.watch(businessAnalyticsDashboardProvider(query));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Статистика'),
        leading: qalagoBackLeading(context, fallbackLocation: '/owner'),
        actions: [
          TextButton(
            onPressed: () => context.push('/owner/monetization/campaigns'),
            child: const Text('Реклама'),
          ),
        ],
      ),
      body: analyticsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: 'Не удалось загрузить статистику. Проверьте сеть и попробуйте снова.',
          onRetry: () => ref.invalidate(businessAnalyticsDashboardProvider(query)),
        ),
        data: (dashboard) {
          final effective = ownerAnalyticsEffectiveDays(dashboard, _days);
          if (effective != _days) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted && _days != effective) setState(() => _days = effective);
            });
          }

          final access = ref.watch(selectedBusinessAccessProvider);
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(businessAnalyticsDashboardProvider(query));
              await ref.read(businessAnalyticsDashboardProvider(query).future);
            },
            child: _AnalyticsBody(
              businessId: widget.businessId,
              businessTitle: widget.businessTitle,
              dashboard: dashboard,
              days: _days,
              effectiveDays: effective,
              access: access,
              onDaysChanged: (value) => setState(() => _days = value),
              onUpgrade: () => context.push('/owner/plan'),
            ),
          );
        },
      ),
    );
  }
}

class _AnalyticsBody extends StatelessWidget {
  const _AnalyticsBody({
    required this.businessId,
    required this.businessTitle,
    required this.dashboard,
    required this.days,
    required this.effectiveDays,
    required this.access,
    required this.onDaysChanged,
    required this.onUpgrade,
  });

  final String businessId;
  final String businessTitle;
  final Map<String, dynamic> dashboard;
  final int days;
  final int effectiveDays;
  final BusinessAccess? access;
  final ValueChanged<int> onDaysChanged;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    final actions = dashboard['actions'] as Map<String, dynamic>?;
    final periodOptions = ownerAnalyticsPeriodOptions(dashboard);
    final upgradeMessage = ownerAnalyticsPrimaryUpgradeMessage(dashboard);
    final isEmpty = ownerAnalyticsIsEmpty(dashboard);
    final canExport = ownerAnalyticsCanExportReport(dashboard, access);

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.screen),
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        Text(
          businessTitle,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
        if (dashboard['headline'] is String) ...[
          const SizedBox(height: 4),
          Text(
            dashboard['headline'] as String,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.black54),
          ),
        ],
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: periodOptions
                .map(
                  (option) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text('$option дн'),
                      selected: days == option,
                      onSelected: (_) => onDaysChanged(option),
                    ),
                  ),
                )
                .toList(),
          ),
        ),
        if (upgradeMessage != null) ...[
          const SizedBox(height: 16),
          OwnerAnalyticsCompactUpgradeCard(message: upgradeMessage, onUpgrade: onUpgrade),
        ],
        if (canExport) ...[
          _ExportReportButton(businessId: businessId, days: days),
          const SizedBox(height: 8),
        ],
        const OwnerAnalyticsSectionTitle('Обзор'),
        if (isEmpty) const OwnerAnalyticsEmptyState() else ...[
          OwnerAnalyticsOverviewGrid(dashboard: dashboard),
          const SizedBox(height: 12),
          if (ownerAnalyticsCap(dashboard, 'periodComparison') && dashboard['comparison'] is Map)
            OwnerAnalyticsComparisonCompact(
              comparison: dashboard['comparison'] as Map<String, dynamic>,
            ),
          if (ownerAnalyticsCap(dashboard, 'viewTrend'))
            OwnerAnalyticsTrendCard(dashboard: dashboard, effectiveDays: effectiveDays),
          if (actions != null) ...[
            const SizedBox(height: 8),
            Text('Целевые действия', style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            OwnerAnalyticsActionsBreakdown(actions: actions),
          ] else if (ownerAnalyticsIsLocked(dashboard, 'actions'))
            Text(
              ownerAnalyticsLockedMessage(dashboard, 'actions') ?? 'Доступно в тарифе Бизнес',
              style: TextStyle(color: Colors.grey.shade700),
            ),
        ],
        _AcquisitionBlock(dashboard: dashboard, onUpgrade: onUpgrade),
        if (ownerAnalyticsCap(dashboard, 'audience') ||
            ownerAnalyticsCap(dashboard, 'audienceGeography') ||
            ownerAnalyticsCap(dashboard, 'popularTimes') ||
            ownerAnalyticsCap(dashboard, 'visitorMetrics') ||
            dashboard['audience'] != null)
          OwnerAnalyticsAudienceSection(dashboard: dashboard),
        OwnerAnalyticsContentSection(dashboard: dashboard),
        if (dashboard['benchmark'] is Map)
          _BenchmarkSection(benchmark: dashboard['benchmark'] as Map<String, dynamic>),
        if (dashboard['recommendations'] is List &&
            (dashboard['recommendations'] as List).isNotEmpty)
          _RecommendationsSection(recommendations: dashboard['recommendations'] as List),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => context.push('/owner/monetization/campaigns'),
          icon: const Icon(Icons.campaign_outlined),
          label: const Text('Статистика рекламы'),
        ),
      ],
    );
  }
}

class _AcquisitionBlock extends StatelessWidget {
  const _AcquisitionBlock({required this.dashboard, required this.onUpgrade});

  final Map<String, dynamic> dashboard;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    final showSection = ownerAnalyticsCap(dashboard, 'trafficSources') ||
        ownerAnalyticsCap(dashboard, 'searchQueries') ||
        ownerAnalyticsCap(dashboard, 'ctr') ||
        ownerAnalyticsIsLocked(dashboard, 'sources') ||
        ownerAnalyticsIsLocked(dashboard, 'searchQueries');

    if (!showSection) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const OwnerAnalyticsSectionTitle('Привлечение'),
        if (dashboard['sources'] is List && (dashboard['sources'] as List).isNotEmpty)
          _SourcesSection(sources: dashboard['sources'] as List)
        else if (dashboard['sourcesStatus'] == 'DEFERRED')
          const _DeferredSourcesSection()
        else if (ownerAnalyticsIsLocked(dashboard, 'sources'))
          _InlineLockedHint(
            message: ownerAnalyticsLockedMessage(dashboard, 'sources') ??
                'Источники доступны в PRO',
          )
        else if (ownerAnalyticsCap(dashboard, 'trafficSources'))
          const _InlineEmptyHint(title: 'Источники', message: 'Недостаточно данных'),
        if (dashboard['searchQueries'] is List &&
            (dashboard['searchQueries'] as List).isNotEmpty)
          _SearchQueriesSection(
            queries: dashboard['searchQueries'] as List,
            otherCount: dashboard['searchQueriesOtherCount'] as num?,
          )
        else if (dashboard['searchQueriesStatus'] == 'INSUFFICIENT_DATA')
          const _InlineEmptyHint(
            title: 'Что ищут пользователи',
            message: 'Недостаточно данных для анализа поисковых запросов',
          )
        else if (ownerAnalyticsIsLocked(dashboard, 'searchQueries'))
          _InlineLockedHint(
            message: ownerAnalyticsLockedMessage(dashboard, 'searchQueries') ??
                'Поисковые запросы доступны в PRO',
          ),
        OwnerAnalyticsFunnelCard(dashboard: dashboard),
      ],
    );
  }
}

class _InlineLockedHint extends StatelessWidget {
  const _InlineLockedHint({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(message, style: TextStyle(color: Colors.grey.shade700)),
    );
  }
}

class _InlineEmptyHint extends StatelessWidget {
  const _InlineEmptyHint({required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        title: Text(title),
        subtitle: Text(message),
      ),
    );
  }
}

class _ExportReportButton extends ConsumerStatefulWidget {
  const _ExportReportButton({required this.businessId, required this.days});

  final String businessId;
  final int days;

  @override
  ConsumerState<_ExportReportButton> createState() => _ExportReportButtonState();
}

class _ExportReportButtonState extends ConsumerState<_ExportReportButton> {
  bool _exporting = false;

  Future<void> _export() async {
    if (_exporting) return;
    setState(() => _exporting = true);
    try {
      final result = await ref.read(catalogRepositoryProvider).fetchAnalyticsExport(
            widget.businessId,
            days: widget.days,
          );
      final shareResult = await shareCsvBytes(result.bytes, result.filename);
      if (!mounted || shareResult.cancelled) return;
      if (shareResult.failed) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Не удалось подготовить отчёт. Попробуйте ещё раз.')),
        );
      }
    } catch (e) {
      if (!mounted) return;
      final text = e.toString().contains('403')
          ? 'Экспорт недоступен для вашей роли или тарифа.'
          : 'Не удалось подготовить отчёт. Попробуйте ещё раз.';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: OutlinedButton.icon(
        onPressed: _exporting ? null : _export,
        icon: _exporting
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.ios_share_outlined),
        label: Text(_exporting ? 'Формирование…' : 'Экспорт CSV'),
      ),
    );
  }
}

class _SearchQueriesSection extends StatelessWidget {
  const _SearchQueriesSection({required this.queries, this.otherCount});

  final List queries;
  final num? otherCount;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Что ищут пользователи', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...queries.whereType<Map>().map(
                  (row) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('"${row['query'] as String? ?? ''}"'),
                    trailing: Text('${ownerAnalyticsFormatCount(row['count'] as num?)} переходов'),
                  ),
                ),
            if (otherCount != null && otherCount! > 0)
              Text(
                'Другие запросы — ${ownerAnalyticsFormatCount(otherCount)}',
                style: TextStyle(color: Colors.grey.shade700),
              ),
          ],
        ),
      ),
    );
  }
}

class _DeferredSourcesSection extends StatelessWidget {
  const _DeferredSourcesSection();

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Источники', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              'Детальная атрибуция источников появится позже.',
              style: TextStyle(color: Colors.grey.shade700),
            ),
          ],
        ),
      ),
    );
  }
}

class _SourcesSection extends StatelessWidget {
  const _SourcesSection({required this.sources});

  final List sources;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Источники', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...sources.whereType<Map>().map(
                  (row) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(row['label'] as String? ?? ''),
                    trailing: Text(
                      '${ownerAnalyticsFormatCount(row['views'] as num?)} · ${row['share'] ?? 0}%',
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _BenchmarkSection extends StatelessWidget {
  const _BenchmarkSection({required this.benchmark});

  final Map<String, dynamic> benchmark;

  @override
  Widget build(BuildContext context) {
    final status = benchmark['status'];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const OwnerAnalyticsSectionTitle('Сравнение с категорией'),
        Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: const Text('Сравнение с категорией'),
            subtitle: status == 'INSUFFICIENT_DATA'
                ? Text(
                    benchmark['message'] as String? ??
                        'Пока недостаточно данных для сравнения',
                  )
                : Text(
                    'Категория: ${benchmark['categoryTitle'] ?? ''}\n'
                    'Просмотры: ${ownerAnalyticsFormatCount(benchmark['businessViews'] as num?)} '
                    '(среднее ${ownerAnalyticsFormatCount(benchmark['categoryAvgViews'] as num?)})\n'
                    'Действия: ${ownerAnalyticsFormatCount(benchmark['businessActions'] as num?)} '
                    '(среднее ${ownerAnalyticsFormatCount(benchmark['categoryAvgActions'] as num?)})',
                  ),
            isThreeLine: true,
          ),
        ),
      ],
    );
  }
}

class _RecommendationsSection extends StatelessWidget {
  const _RecommendationsSection({required this.recommendations});

  final List recommendations;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const OwnerAnalyticsSectionTitle('Рекомендации'),
        ...recommendations.whereType<Map>().map(
              (item) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(item['title'] as String? ?? ''),
                  subtitle: Text(item['body'] as String? ?? ''),
                ),
              ),
            ),
      ],
    );
  }
}
