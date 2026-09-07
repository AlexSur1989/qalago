import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../owner_analytics_utils.dart';
import '../owner_utils.dart';
import 'widgets/owner_views_chart.dart';

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
        title: Text('Статистика · ${widget.businessTitle}'),
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
          message: '$e',
          onRetry: () => ref.invalidate(businessAnalyticsDashboardProvider(query)),
        ),
        data: (dashboard) => _AnalyticsBody(
          dashboard: dashboard,
          days: _days,
          onDaysChanged: (value) => setState(() => _days = value),
          onUpgrade: () => context.push('/owner/plan'),
        ),
      ),
    );
  }
}

class _AnalyticsBody extends StatelessWidget {
  const _AnalyticsBody({
    required this.dashboard,
    required this.days,
    required this.onDaysChanged,
    required this.onUpgrade,
  });

  final Map<String, dynamic> dashboard;
  final int days;
  final ValueChanged<int> onDaysChanged;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    final overview = dashboard['overview'] as Map<String, dynamic>? ?? {};
    final actions = dashboard['actions'] as Map<String, dynamic>?;
    final trends = dashboard['trends'] as Map<String, dynamic>?;
    final periodOptions = ownerAnalyticsPeriodOptions(dashboard);
    final effectiveDays =
        (dashboard['effectiveRange'] as Map?)?['days'] as num? ?? days;
    final viewTrend = ownerAnalyticsTrendSeries(trends, 'views');
    final actionTrend = ownerAnalyticsTrendSeries(trends, 'actions');

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.screen),
      children: [
        Text(
          dashboard['headline'] as String? ?? 'Статистика бизнеса',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.black54,
              ),
        ),
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
        const SizedBox(height: 16),
        _MetricCard(
          label: 'Просмотры',
          value: ownerFormatNumber((overview['views'] as num?)?.toInt() ?? 0),
        ),
        if (actions != null) ...[
          _MetricCard(
            label: 'Действия клиентов',
            value: ownerFormatNumber((actions['total'] as num?)?.toInt() ?? 0),
          ),
          const SizedBox(height: 8),
          Text('Детализация действий', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          ...ownerAnalyticsActionKeys.map(
            (key) => _StatTile(
              label: ownerAnalyticsActionLabel(key),
              value: (actions[key] as num?)?.toInt() ?? 0,
            ),
          ),
        ] else
          _LockedSection(
            label: 'Действия клиентов',
            message: ownerAnalyticsLockedMessage(dashboard, 'actions') ?? 'Доступно с BASIC',
            onUpgrade: onUpgrade,
          ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Просмотры за $effectiveDays дн.',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                OwnerViewsChart(items: viewTrend),
              ],
            ),
          ),
        ),
        if (actionTrend.isNotEmpty) ...[
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Действия за $effectiveDays дн.',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  OwnerViewsChart(items: actionTrend),
                ],
              ),
            ),
          ),
        ],
        const SizedBox(height: 12),
        if (dashboard['sources'] is List && (dashboard['sources'] as List).isNotEmpty)
          _SourcesSection(sources: dashboard['sources'] as List)
        else if (dashboard['sourcesStatus'] == 'DEFERRED')
          const _DeferredSourcesSection()
        else if (ownerAnalyticsIsLocked(dashboard, 'sources'))
          _LockedSection(
            label: 'Источники',
            message: ownerAnalyticsLockedMessage(dashboard, 'sources') ?? 'Доступно с PREMIUM',
            onUpgrade: onUpgrade,
          )
        else if (dashboard['capabilities']?['trafficSources'] == true)
          const _EmptySourcesSection(),
        if (dashboard['searchQueries'] is List &&
            (dashboard['searchQueries'] as List).isNotEmpty)
          _SearchQueriesSection(
            queries: dashboard['searchQueries'] as List,
            otherCount: dashboard['searchQueriesOtherCount'] as num?,
          )
        else if (dashboard['searchQueriesStatus'] == 'INSUFFICIENT_DATA')
          const _InsufficientSearchQueriesSection()
        else if (ownerAnalyticsIsLocked(dashboard, 'searchQueries'))
          _LockedSection(
            label: 'Поисковые запросы',
            message: ownerAnalyticsLockedMessage(dashboard, 'searchQueries') ??
                'Поисковые запросы доступны с PREMIUM',
            onUpgrade: onUpgrade,
          ),
        if (dashboard['audienceGeography'] is List &&
            (dashboard['audienceGeography'] as List).isNotEmpty)
          _AudienceGeographySection(
            items: dashboard['audienceGeography'] as List,
          )
        else if (dashboard['audienceGeographyStatus'] == 'INSUFFICIENT_DATA')
          const _InsufficientAudienceGeographySection()
        else if (ownerAnalyticsIsLocked(dashboard, 'audienceGeography'))
          _LockedSection(
            label: 'Аудитория по расстоянию',
            message: ownerAnalyticsLockedMessage(dashboard, 'audienceGeography') ??
                'Аналитика аудитории доступна на тарифе VIP',
            onUpgrade: onUpgrade,
          ),
        if (dashboard['conversion'] is Map)
          _ConversionSection(conversion: dashboard['conversion'] as Map<String, dynamic>)
        else if (ownerAnalyticsIsLocked(dashboard, 'conversion'))
          _LockedSection(
            label: 'Конверсия',
            message: ownerAnalyticsLockedMessage(dashboard, 'conversion') ?? 'Доступно с PREMIUM',
            onUpgrade: onUpgrade,
          ),
        if (dashboard['comparison'] is Map)
          _ComparisonSection(comparison: dashboard['comparison'] as Map<String, dynamic>)
        else if (ownerAnalyticsIsLocked(dashboard, 'comparison'))
          _LockedSection(
            label: 'Сравнение периодов',
            message: ownerAnalyticsLockedMessage(dashboard, 'comparison') ?? 'Доступно с PREMIUM',
            onUpgrade: onUpgrade,
          ),
        if (dashboard['popularTimes'] is Map)
          _PopularTimesSection(popularTimes: dashboard['popularTimes'] as Map<String, dynamic>)
        else if (ownerAnalyticsIsLocked(dashboard, 'popularTimes'))
          _LockedSection(
            label: 'Популярные часы',
            message: ownerAnalyticsLockedMessage(dashboard, 'popularTimes') ?? 'Доступно с VIP',
            onUpgrade: onUpgrade,
          ),
        if (dashboard['benchmark'] is Map)
          _BenchmarkSection(benchmark: dashboard['benchmark'] as Map<String, dynamic>)
        else if (ownerAnalyticsIsLocked(dashboard, 'benchmark'))
          _LockedSection(
            label: 'Сравнение с категорией',
            message: ownerAnalyticsLockedMessage(dashboard, 'benchmark') ?? 'Доступно с VIP',
            onUpgrade: onUpgrade,
          ),
        if (dashboard['recommendations'] is List)
          _RecommendationsSection(recommendations: dashboard['recommendations'] as List)
        else if (ownerAnalyticsIsLocked(dashboard, 'recommendations'))
          _LockedSection(
            label: 'Рекомендации',
            message: ownerAnalyticsLockedMessage(dashboard, 'recommendations') ?? 'Доступно с VIP',
            onUpgrade: onUpgrade,
          ),
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

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(label),
        trailing: Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        title: Text(label),
        trailing: Text(
          ownerFormatNumber(value),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
    );
  }
}

class _LockedSection extends StatelessWidget {
  const _LockedSection({
    required this.label,
    required this.message,
    required this.onUpgrade,
  });

  final String label;
  final String message;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: Colors.grey.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
                Chip(
                  label: Text(message, style: const TextStyle(fontSize: 11)),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Раздел недоступен на текущем тарифе.',
              style: TextStyle(color: Colors.grey.shade700),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: onUpgrade,
              style: FilledButton.styleFrom(backgroundColor: AppTheme.kzBlue),
              child: const Text('Улучшить тариф'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchQueriesSection extends StatelessWidget {
  const _SearchQueriesSection({
    required this.queries,
    this.otherCount,
  });

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
            const Text(
              'По каким запросам вас находят',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            ...queries.whereType<Map>().map(
                  (row) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(row['query'] as String? ?? ''),
                    trailing: Text(
                      '${row['count'] ?? 0} · ${row['percentage'] ?? 0}%',
                    ),
                  ),
                ),
            if (otherCount != null && otherCount! > 0)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Другие запросы — ${otherCount!.toInt()}',
                  style: TextStyle(color: Colors.grey.shade700),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _InsufficientSearchQueriesSection extends StatelessWidget {
  const _InsufficientSearchQueriesSection();

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'По каким запросам вас находят',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Недостаточно данных для анализа поисковых запросов',
              style: TextStyle(color: Colors.grey.shade700),
            ),
          ],
        ),
      ),
    );
  }
}

class _AudienceGeographySection extends StatelessWidget {
  const _AudienceGeographySection({required this.items});

  final List items;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Аудитория по расстоянию',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              'Показывает примерное расстояние пользователей от вашей компании '
              'в момент открытия карточки. Точные координаты не сохраняются.',
              style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
            ),
            const SizedBox(height: 8),
            ...items.whereType<Map>().map(
                  (row) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(row['label'] as String? ?? ''),
                    trailing: Text(
                      '${row['count'] ?? 0} · ${row['percentage'] ?? 0}%',
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _InsufficientAudienceGeographySection extends StatelessWidget {
  const _InsufficientAudienceGeographySection();

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Аудитория по расстоянию',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Недостаточно данных для анализа аудитории по расстоянию',
              style: TextStyle(color: Colors.grey.shade700),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptySourcesSection extends StatelessWidget {
  const _EmptySourcesSection();

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Источники просмотров',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Недостаточно данных',
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
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Источники просмотров',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                Chip(
                  label: const Text('Скоро', style: TextStyle(fontSize: 11)),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Детальная атрибуция источников появится после внедрения отслеживания referrer. '
              'Доли по источникам сейчас не показываются.',
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
            const Text('Источники просмотров', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...sources.whereType<Map>().map(
                  (row) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(row['label'] as String? ?? ''),
                    trailing: Text('${row['views'] ?? 0} · ${row['share'] ?? 0}%'),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _ConversionSection extends StatelessWidget {
  const _ConversionSection({required this.conversion});

  final Map<String, dynamic> conversion;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        title: const Text('Конверсия'),
        subtitle: Text(
          '${conversion['actions'] ?? 0} действий из ${conversion['views'] ?? 0} просмотров',
        ),
        trailing: Text(
          '${conversion['rate'] ?? 0}%',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
    );
  }
}

class _ComparisonSection extends StatelessWidget {
  const _ComparisonSection({required this.comparison});

  final Map<String, dynamic> comparison;

  @override
  Widget build(BuildContext context) {
    final metrics = comparison['metrics'];
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Сравнение периодов', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            if (metrics is List)
              ...metrics.whereType<Map>().map(
                    (row) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(row['label'] as String? ?? ''),
                      subtitle: Text(
                        '${row['current'] ?? 0} vs ${row['previous'] ?? 0}',
                      ),
                      trailing: Text(ownerAnalyticsDeltaPercent(row['deltaPercent'] as num?) ?? '—'),
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}

class _PopularTimesSection extends StatelessWidget {
  const _PopularTimesSection({required this.popularTimes});

  final Map<String, dynamic> popularTimes;

  @override
  Widget build(BuildContext context) {
    final weekdays = popularTimes['byWeekday'];
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Популярные дни', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            if (weekdays is List)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: weekdays.whereType<Map>().map((row) {
                  return Chip(
                    label: Text('${row['label'] ?? ''}: ${row['count'] ?? 0}'),
                  );
                }).toList(),
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
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        title: Text('Категория · ${benchmark['categoryTitle'] ?? ''}'),
        subtitle: benchmark['status'] == 'INSUFFICIENT_DATA'
            ? Text(benchmark['message'] as String? ?? 'Недостаточно данных для сравнения.')
            : Text(
                'Просмотры ${benchmark['businessViews'] ?? 0} vs ${benchmark['categoryAvgViews'] ?? 0}\n'
                'Действия ${benchmark['businessActions'] ?? 0} vs ${benchmark['categoryAvgActions'] ?? 0}',
              ),
        isThreeLine: true,
      ),
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
        const Text('Рекомендации', style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
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
