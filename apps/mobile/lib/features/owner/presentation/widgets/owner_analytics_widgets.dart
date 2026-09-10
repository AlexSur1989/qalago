import 'package:flutter/material.dart';

import '../../../../core/theme/theme_extensions.dart';
import '../../owner_analytics_utils.dart';
import 'owner_views_chart.dart';

class OwnerAnalyticsSectionTitle extends StatelessWidget {
  const OwnerAnalyticsSectionTitle(this.title, {super.key, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, style: context.captionStyle),
          ],
        ],
      ),
    );
  }
}

class OwnerAnalyticsCompactUpgradeCard extends StatelessWidget {
  const OwnerAnalyticsCompactUpgradeCard({
    super.key,
    required this.message,
    required this.onUpgrade,
  });

  final String message;
  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    final scheme = context.cs;
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: scheme.primary.withValues(alpha: 0.08),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.lock_outline, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(message, style: context.sectionTitleStyle),
                  const SizedBox(height: 10),
                  TextButton(
                    onPressed: onUpgrade,
                    child: const Text('Посмотреть тарифы'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OwnerAnalyticsOverviewGrid extends StatelessWidget {
  const OwnerAnalyticsOverviewGrid({super.key, required this.dashboard});

  final Map<String, dynamic> dashboard;

  @override
  Widget build(BuildContext context) {
    final overview = dashboard['overview'] as Map<String, dynamic>? ?? {};
    final caps = ownerAnalyticsCapabilities(dashboard);
    final tiles = <Widget>[];

    void addTile(String label, String value, {String? hint}) {
      tiles.add(_OverviewTile(label: label, value: value, hint: hint));
    }

    addTile('Просмотры карточки', ownerAnalyticsFormatCount(overview['views'] as num?));

    if (caps['impressions'] == true && overview.containsKey('impressions')) {
      addTile('Показы', ownerAnalyticsFormatCount(overview['impressions'] as num?));
    }

    if (caps['actions'] == true) {
      final actionsVal = overview['actions'] ?? overview['totalCustomerActions'];
      if (actionsVal != null) {
        addTile('Целевые действия', ownerAnalyticsFormatCount(actionsVal as num?));
      }
    }

    if (caps['ctr'] == true) {
      final ctr = ownerAnalyticsFormatRatePercent(overview['ctr'] as num?);
      if (ctr != null) addTile('CTR', ctr);
    }

    if (caps['conversion'] == true) {
      final conv = ownerAnalyticsFormatRatePercent(overview['conversionRate'] as num?);
      if (conv != null) {
        addTile(
          'Конверсия в действие',
          conv,
          hint:
              'Доля просмотров карточки, после которых пользователь совершил '
              'целевое действие: звонок, WhatsApp, маршрут, сайт, Instagram '
              'или добавление в избранное.',
        );
      }
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final crossCount = width < 360 ? 1 : 2;
        return GridView.count(
          crossAxisCount: crossCount,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: crossCount == 1 ? 3.2 : 2.4,
          children: tiles,
        );
      },
    );
  }
}

class _OverviewTile extends StatelessWidget {
  const _OverviewTile({required this.label, required this.value, this.hint});

  final String label;
  final String value;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(label, style: context.captionStyle),
                ),
                if (hint != null)
                  Tooltip(
                    message: hint!,
                    triggerMode: TooltipTriggerMode.tap,
                    child: Icon(Icons.info_outline, size: 18, color: context.cs.onSurfaceVariant),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(value, style: context.metricValueStyle?.copyWith(fontSize: 22)),
          ],
        ),
      ),
    );
  }
}

class OwnerAnalyticsTrendCard extends StatefulWidget {
  const OwnerAnalyticsTrendCard({
    super.key,
    required this.dashboard,
    required this.effectiveDays,
  });

  final Map<String, dynamic> dashboard;
  final int effectiveDays;

  @override
  State<OwnerAnalyticsTrendCard> createState() => _OwnerAnalyticsTrendCardState();
}

class _OwnerAnalyticsTrendCardState extends State<OwnerAnalyticsTrendCard> {
  bool _showActions = false;

  @override
  Widget build(BuildContext context) {
    final trends = widget.dashboard['trends'] as Map<String, dynamic>?;
    final viewTrend = ownerAnalyticsTrendSeries(trends, 'views');
    final actionTrend = ownerAnalyticsTrendSeries(trends, 'actions');
    final canActions =
        ownerAnalyticsCap(widget.dashboard, 'actionTrend') && actionTrend.isNotEmpty;

    final series = _showActions && canActions ? actionTrend : viewTrend;
    final title = _showActions && canActions
        ? 'Действия за ${widget.effectiveDays} дн.'
        : 'Просмотры за ${widget.effectiveDays} дн.';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.w700))),
                if (canActions)
                  SegmentedButton<bool>(
                    segments: const [
                      ButtonSegment(value: false, label: Text('Просмотры')),
                      ButtonSegment(value: true, label: Text('Действия')),
                    ],
                    selected: {_showActions},
                    onSelectionChanged: (set) => setState(() => _showActions = set.first),
                    style: const ButtonStyle(visualDensity: VisualDensity.compact),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            OwnerViewsChart(items: series, days: widget.effectiveDays),
          ],
        ),
      ),
    );
  }
}

class OwnerAnalyticsActionsBreakdown extends StatelessWidget {
  const OwnerAnalyticsActionsBreakdown({super.key, required this.actions});

  final Map<String, dynamic> actions;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: ownerAnalyticsIntentActionKeys.map((key) {
        final raw = actions[key];
        if (raw == null) return const SizedBox.shrink();
        final count = (raw as num).toInt();
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Icon(ownerAnalyticsActionIcon(key)),
            title: Text(ownerAnalyticsActionLabel(key)),
            trailing: Text(
              ownerAnalyticsFormatCount(count),
              style: context.metricValueStyle?.copyWith(fontSize: 18),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class OwnerAnalyticsFunnelCard extends StatelessWidget {
  const OwnerAnalyticsFunnelCard({super.key, required this.dashboard});

  final Map<String, dynamic> dashboard;

  @override
  Widget build(BuildContext context) {
    if (!ownerAnalyticsCap(dashboard, 'ctr') && !ownerAnalyticsCap(dashboard, 'conversion')) {
      return const SizedBox.shrink();
    }

    final overview = dashboard['overview'] as Map<String, dynamic>? ?? {};
    final impressions = overview['impressions'] as num?;
    final views = overview['views'] as num?;
    final actions =
        (overview['actions'] ?? overview['totalCustomerActions'] ?? (dashboard['actions'] as Map?)?['total']) as num?;

    final steps = <String>[];
    if (ownerAnalyticsCap(dashboard, 'impressions') && impressions != null) {
      steps.add('${ownerAnalyticsFormatCount(impressions)} показов');
    }
    if (views != null) {
      steps.add('${ownerAnalyticsFormatCount(views)} просмотров');
    }
    if (ownerAnalyticsCap(dashboard, 'actions') && actions != null) {
      steps.add('${ownerAnalyticsFormatCount(actions)} целевых действий');
    }

    if (steps.length < 2) return const SizedBox.shrink();

    final ctr = ownerAnalyticsFormatRatePercent(overview['ctr'] as num?);
    final conversion = ownerAnalyticsFormatRatePercent(overview['conversionRate'] as num?);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Воронка периода', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            for (var i = 0; i < steps.length; i++) ...[
              Text(steps[i], style: const TextStyle(fontSize: 16)),
              if (i < steps.length - 1)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Icon(Icons.arrow_downward, size: 18, color: context.cs.onSurfaceVariant),
                ),
            ],
            if (ctr != null || conversion != null) ...[
              const SizedBox(height: 12),
              if (ctr != null) Text('CTR: $ctr'),
              if (conversion != null) Text('Конверсия в действие: $conversion'),
            ],
            const SizedBox(height: 8),
            Text(
              'Показатели рассчитаны по агрегированным данным периода.',
              style: context.captionStyle,
            ),
          ],
        ),
      ),
    );
  }
}

class OwnerAnalyticsComparisonCompact extends StatelessWidget {
  const OwnerAnalyticsComparisonCompact({super.key, required this.comparison});

  final Map<String, dynamic> comparison;

  @override
  Widget build(BuildContext context) {
    final metrics = comparison['metrics'];
    if (metrics is! List || metrics.isEmpty) return const SizedBox.shrink();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('К предыдущему периоду', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...metrics.whereType<Map>().map((row) {
              final delta = ownerAnalyticsDeltaPercent(row['deltaPercent'] as num?);
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Expanded(child: Text(row['label'] as String? ?? '')),
                    Text(
                      delta ?? '—',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: _deltaColor(context, row['deltaPercent'] as num?),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Color _deltaColor(BuildContext context, num? delta) {
    final scheme = context.cs;
    if (delta == null) return scheme.onSurfaceVariant;
    if (delta > 0) return context.successColor;
    if (delta < 0) return scheme.error;
    return scheme.onSurfaceVariant;
  }
}

class OwnerAnalyticsPopularHoursSection extends StatelessWidget {
  const OwnerAnalyticsPopularHoursSection({super.key, required this.popularTimes});

  final Map<String, dynamic> popularTimes;

  @override
  Widget build(BuildContext context) {
    final hours = ownerAnalyticsPopularHours(popularTimes);
    if (hours.isEmpty) {
      return Card(
        margin: const EdgeInsets.only(bottom: 12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Популярное время', style: TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text('Недостаточно данных', style: context.captionStyle),
            ],
          ),
        ),
      );
    }

    final max = hours.fold<int>(1, (m, row) {
      final c = (row['count'] as num?)?.toInt() ?? 0;
      return c > m ? c : m;
    });

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Популярное время', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            ...hours.take(8).map((row) {
              final hour = (row['hour'] as num?)?.toInt() ?? 0;
              final count = (row['count'] as num?)?.toInt() ?? 0;
              final label = '${hour.toString().padLeft(2, '0')}:00';
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    SizedBox(width: 48, child: Text(label)),
                    Expanded(
                      child: LinearProgressIndicator(
                        value: count / max,
                        minHeight: 8,
                        borderRadius: BorderRadius.circular(4),
                        backgroundColor: context.cs.outlineVariant,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(ownerAnalyticsFormatCount(count)),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class OwnerAnalyticsAudienceSection extends StatelessWidget {
  const OwnerAnalyticsAudienceSection({super.key, required this.dashboard});

  final Map<String, dynamic> dashboard;

  @override
  Widget build(BuildContext context) {
    final audience = dashboard['audience'] as Map<String, dynamic>?;
    final overview = dashboard['overview'] as Map<String, dynamic>? ?? {};
    final geography = dashboard['audienceGeography'];
    final geoStatus = dashboard['audienceGeographyStatus'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const OwnerAnalyticsSectionTitle(
          'Аудитория',
          subtitle: 'Доли просмотров карточки по типу посетителя',
        ),
        if (audience != null) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _audienceRow(
                    'Новые посетители',
                    audience['newShare'],
                    audience['newVisitorViews'],
                  ),
                  const Divider(),
                  _audienceRow(
                    'Вернувшиеся посетители',
                    audience['returningShare'],
                    audience['returningVisitorViews'],
                  ),
                ],
              ),
            ),
          ),
        ],
        if (ownerAnalyticsCap(dashboard, 'visitorMetrics')) ...[
          const SizedBox(height: 8),
          _VisitorMetricsOverview(overview: overview),
        ],
        if (ownerAnalyticsCap(dashboard, 'popularTimes') && dashboard['popularTimes'] is Map)
          OwnerAnalyticsPopularHoursSection(
            popularTimes: dashboard['popularTimes'] as Map<String, dynamic>,
          ),
        if (geography is List && geography.isNotEmpty)
          _AudienceGeographyList(items: geography)
        else if (geoStatus == 'INSUFFICIENT_DATA')
          Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Недостаточно данных для анализа аудитории по расстоянию',
                style: context.captionStyle,
              ),
            ),
          ),
      ],
    );
  }

  Widget _audienceRow(String title, dynamic share, dynamic views) {
    final shareText = ownerAnalyticsFormatRatePercent(share as num?);
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title),
      subtitle: shareText != null ? Text('Доля просмотров: $shareText') : null,
      trailing: views != null
          ? Text(
              ownerAnalyticsFormatCount(views as num),
              style: const TextStyle(fontWeight: FontWeight.bold),
            )
          : null,
    );
  }
}

class _VisitorMetricsOverview extends StatelessWidget {
  const _VisitorMetricsOverview({required this.overview});

  final Map<String, dynamic> overview;

  @override
  Widget build(BuildContext context) {
    final periodUv = overview['uniqueVisitorsPeriodDistinct'];
    final periodSessions = overview['sessionsPeriodDistinct'];
    final dailyUv = overview['uniqueVisitorsDailySumApprox'];
    final dailySessions = overview['sessionsDailySumApprox'];

    final tiles = <Widget>[];

    if (periodUv != null) {
      tiles.add(_metricLine('Уникальные посетители', periodUv));
    }
    if (periodSessions != null) {
      tiles.add(_metricLine('Сессии', periodSessions));
    }

    if (tiles.isEmpty && (dailyUv != null || dailySessions != null)) {
      if (dailyUv != null) {
        tiles.add(_metricLine('Суммарно уникальных посетителей по дням', dailyUv));
      }
      if (dailySessions != null) {
        tiles.add(_metricLine('Суммарно сессий по дням', dailySessions));
      }
    }

    if (tiles.isEmpty) return const SizedBox.shrink();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: tiles),
      ),
    );
  }

  Widget _metricLine(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          Text(
            ownerAnalyticsFormatCount(value as num?),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}

class _AudienceGeographyList extends StatelessWidget {
  const _AudienceGeographyList({required this.items});

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
            const Text('Расстояние до заведения', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(
              'Агрегированные интервалы без точных координат пользователей.',
              style: context.captionStyle,
            ),
            const SizedBox(height: 8),
            ...items.whereType<Map>().map(
                  (row) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(row['label'] as String? ?? ''),
                    trailing: Text(
                      '${ownerAnalyticsFormatCount(row['count'] as num?)} · ${row['percentage'] ?? 0}%',
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class OwnerAnalyticsContentSection extends StatelessWidget {
  const OwnerAnalyticsContentSection({super.key, required this.dashboard});

  final Map<String, dynamic> dashboard;

  @override
  Widget build(BuildContext context) {
    final promo = dashboard['promotions'];
    final cat = dashboard['catalog'];
    final promoMap = promo is Map<String, dynamic> ? promo : null;
    final catalogMap = cat is Map<String, dynamic> ? cat : null;
    final showPromo =
        promoMap != null && ownerAnalyticsCap(dashboard, 'promotionAnalytics');
    final showCatalog =
        catalogMap != null && ownerAnalyticsCap(dashboard, 'catalogAnalytics');

    if (!showPromo && !showCatalog) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const OwnerAnalyticsSectionTitle('Контент'),
        if (showPromo) _PromotionsBlock(promotions: promoMap!),
        if (showCatalog) _CatalogBlock(catalog: catalogMap!),
      ],
    );
  }
}

class _PromotionsBlock extends StatelessWidget {
  const _PromotionsBlock({required this.promotions});

  final Map<String, dynamic> promotions;

  @override
  Widget build(BuildContext context) {
    final actionsUnavailable = ownerAnalyticsPromotionActionsUnavailable(promotions);
    final byPromotion = promotions['byPromotion'];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Акции', style: TextStyle(fontWeight: FontWeight.w700)),
            if (promotions.containsKey('promotionViews')) ...[
              const SizedBox(height: 8),
              Text(
                'Просмотры акций: ${ownerAnalyticsFormatCount(promotions['promotionViews'] as num?)}',
              ),
            ],
            if (byPromotion is List && byPromotion.isNotEmpty) ...[
              const SizedBox(height: 12),
              ...byPromotion.whereType<Map>().map((row) {
                final id = row['promotionId'] as String? ?? '';
                final shortId = id.length > 8 ? '${id.substring(0, 8)}…' : id;
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(id.isEmpty ? 'Акция' : 'Акция · $shortId'),
                  trailing: Text(ownerAnalyticsFormatCount(row['views'] as num?)),
                );
              }),
            ],
            if (actionsUnavailable) ...[
              const SizedBox(height: 8),
              Text(
                'Действия по акциям пока не измеряются',
                style: context.captionStyle,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _CatalogBlock extends StatelessWidget {
  const _CatalogBlock({required this.catalog});

  final Map<String, dynamic> catalog;

  @override
  Widget build(BuildContext context) {
    final items = catalog['items'];
    final actionsUnavailable = ownerAnalyticsCatalogActionsUnavailable(catalog);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Каталог', style: TextStyle(fontWeight: FontWeight.w700)),
            if (items is List && items.isNotEmpty)
              ...items.whereType<Map>().take(10).map((row) {
                final id = row['catalogItemId'] as String? ?? '';
                final shortId = id.length > 8 ? '${id.substring(0, 8)}…' : id;
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(id.isEmpty ? 'Позиция' : 'Позиция · $shortId'),
                  trailing: Text(ownerAnalyticsFormatCount(row['views'] as num?)),
                );
              })
            else
              Text('Недостаточно данных', style: context.captionStyle),
            if (actionsUnavailable) ...[
              const SizedBox(height: 8),
              Text(
                'Действия по позициям каталога пока не измеряются',
                style: context.captionStyle,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class OwnerAnalyticsEmptyState extends StatelessWidget {
  const OwnerAnalyticsEmptyState({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Center(
        child: Text(
          'Статистика появится после первых просмотров карточки.',
          textAlign: TextAlign.center,
          style: context.captionStyle,
        ),
      ),
    );
  }
}
