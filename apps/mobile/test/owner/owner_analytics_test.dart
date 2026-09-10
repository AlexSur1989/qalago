import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/rbac/business_access.dart';
import 'package:qalago_mobile/features/owner/owner_analytics_utils.dart';
import 'package:qalago_mobile/features/owner/presentation/widgets/owner_analytics_widgets.dart';

Map<String, dynamic> mockDashboard({
  required String plan,
  Map<String, dynamic>? overrides,
}) {
  final isFree = plan == 'FREE';
  final isBasic = plan == 'BASIC';
  final isPremium = plan == 'PREMIUM';
  final isVip = plan == 'VIP';
  final isProOrVip = isPremium || isVip;

  return {
    'plan': plan,
    'capabilities': {
      'maxDays': isVip ? 365 : (isPremium ? 90 : 30),
      'views': true,
      'viewTrend': true,
      'actions': !isFree,
      'actionTrend': !isFree,
      'impressions': !isFree,
      'ctr': isProOrVip,
      'trafficSources': isProOrVip,
      'searchQueries': isProOrVip,
      'conversion': isProOrVip,
      'periodComparison': !isFree,
      'promotionAnalytics': !isFree,
      'promotionBreakdown': isProOrVip,
      'popularTimes': isVip,
      'benchmark': isVip,
      'recommendations': isVip,
      'audienceGeography': isVip,
      'audience': isVip,
      'catalogAnalytics': isVip,
      'visitorMetrics': isVip,
      'reportExport': isProOrVip,
    },
    'lockedSections': isFree
        ? [
            {
              'id': 'actions',
              'label': 'Действия',
              'message': 'Больше данных доступно в тарифе Бизнес',
            },
          ]
        : isBasic
            ? [
                {
                  'id': 'sources',
                  'label': 'Источники',
                  'message': 'Источники, поисковые запросы и CTR доступны в PRO',
                },
              ]
            : [],
    'effectiveRange': {'days': 30, 'from': '2026-08-01', 'to': '2026-08-31'},
    'overview': {
      'views': 12,
      if (!isFree) ...{
        'impressions': 1200,
        'actions': 68,
        'totalCustomerActions': 68,
      },
      if (isProOrVip) ...{
        'ctr': 1.0,
        'conversionRate': 566.7,
      },
      if (isVip) ...{
        'uniqueVisitorsPeriodDistinct': 1240,
        'sessionsPeriodDistinct': 1500,
      },
    },
    'actions': isFree
        ? null
        : {
            'total': 68,
            'calls': 10,
            'whatsapp': 8,
            'routes': 12,
            'website': 5,
            'instagram': 3,
            'favorites': 30,
            'promotionViews': 99,
          },
    'trends': {
      'views': [
        {'date': '2026-09-01', 'count': 3},
      ],
      if (!isFree)
        'actions': [
          {'date': '2026-09-01', 'count': 1},
        ],
    },
    if (!isFree)
      'promotions': {
        'promotionViews': 40,
        if (isProOrVip) ...{
          'byPromotion': [
            {'promotionId': 'promo1', 'views': 20},
          ],
          'actionsAvailable': false,
        },
      },
    if (isProOrVip) ...{
      'sources': [
        {'source': 'SEARCH', 'label': 'Поиск', 'views': 10, 'share': 50},
      ],
      'searchQueries': [
        {'query': 'кафе', 'count': 12, 'percentage': 60},
      ],
      'searchQueriesStatus': 'AVAILABLE',
      'comparison': {
        'metrics': [
          {
            'key': 'views',
            'label': 'Просмотры',
            'current': 12,
            'previous': 10,
            'deltaPercent': 20,
          },
        ],
      },
    },
    if (isVip) ...{
      'audience': {
        'newVisitorViews': 8,
        'returningVisitorViews': 4,
        'totalClassified': 12,
        'newShare': 66.7,
        'returningShare': 33.3,
      },
      'popularTimes': {
        'byHour': [
          {'hour': 18, 'count': 5},
          {'hour': 12, 'count': 3},
        ],
        'byWeekday': [
          {'weekday': 1, 'label': 'Пн', 'count': 0},
        ],
      },
      'catalog': {
        'items': [
          {'catalogItemId': 'item1', 'views': 7},
        ],
        'actionsAvailable': false,
      },
      'audienceGeography': [
        {'bucket': 'LT_1_KM', 'label': 'до 1 км', 'count': 12, 'percentage': 50},
      ],
      'audienceGeographyStatus': 'AVAILABLE',
      'benchmark': {
        'categoryTitle': 'Кафе',
        'businessViews': 12,
        'categoryAvgViews': 8,
        'businessActions': 4,
        'categoryAvgActions': 3,
      },
      'recommendations': [
        {'id': 'r1', 'title': 'Finding', 'body': 'Suggestion'},
      ],
    },
    ...?overrides,
  };
}

void main() {
  group('FREE tier', () {
    test('views visible and actions locked', () {
      final dashboard = mockDashboard(plan: 'FREE');
      expect((dashboard['overview'] as Map)['views'], 12);
      expect(dashboard['actions'], isNull);
      expect(dashboard['overview'], isNot(contains('impressions')));
      expect(ownerAnalyticsIsLocked(dashboard, 'actions'), isTrue);
      expect(ownerAnalyticsCap(dashboard, 'ctr'), isFalse);
    });

    test('upgrade message for FREE', () {
      final dashboard = mockDashboard(plan: 'FREE');
      expect(
        ownerAnalyticsPrimaryUpgradeMessage(dashboard),
        'Больше данных доступно в тарифе Бизнес',
      );
    });

    test('period options max 30', () {
      expect(ownerAnalyticsPeriodOptions(mockDashboard(plan: 'FREE')), [7, 30]);
    });

    test('report export not available', () {
      expect(ownerAnalyticsCanExportReport(mockDashboard(plan: 'FREE'), null), isFalse);
    });
  });

  group('BASIC tier', () {
    test('actions and impressions visible', () {
      final dashboard = mockDashboard(plan: 'BASIC');
      expect((dashboard['actions'] as Map)['total'], 68);
      expect((dashboard['overview'] as Map)['impressions'], 1200);
      expect(ownerAnalyticsCap(dashboard, 'ctr'), isFalse);
      expect(ownerAnalyticsCap(dashboard, 'trafficSources'), isFalse);
    });

    test('promotion summary without breakdown', () {
      final dashboard = mockDashboard(plan: 'BASIC');
      expect(dashboard['promotions'], isNotNull);
      expect(dashboard['promotions']['byPromotion'], isNull);
    });

    test('comparison available on BASIC', () {
      final dashboard = mockDashboard(plan: 'BASIC', overrides: {
        'comparison': {
          'metrics': [
            {'key': 'views', 'label': 'Просмотры', 'deltaPercent': 5},
          ],
        },
      });
      expect(ownerAnalyticsCap(dashboard, 'periodComparison'), isTrue);
    });
  });

  group('PREMIUM tier', () {
    test('sources and search visible', () {
      final dashboard = mockDashboard(plan: 'PREMIUM');
      expect((dashboard['sources'] as List), isNotEmpty);
      expect((dashboard['searchQueries'] as List), isNotEmpty);
      expect(ownerAnalyticsCap(dashboard, 'audience'), isFalse);
    });

    test('report export with permission', () {
      final dashboard = mockDashboard(plan: 'PREMIUM');
      expect(ownerAnalyticsCanExportReport(dashboard, null), isTrue);
      const manager = BusinessAccess(
        role: BusinessAccessRole.manager,
        permissions: [BusinessPermission.analyticsView],
      );
      expect(ownerAnalyticsCanExportReport(dashboard, manager), isFalse);
      const exporter = BusinessAccess(
        role: BusinessAccessRole.manager,
        permissions: [
          BusinessPermission.analyticsView,
          BusinessPermission.analyticsExport,
        ],
      );
      expect(ownerAnalyticsCanExportReport(dashboard, exporter), isTrue);
    });

    test('90-day period option only PRO+', () {
      expect(ownerAnalyticsPeriodOptions(mockDashboard(plan: 'PREMIUM')), [7, 30, 90]);
    });
  });

  group('VIP tier', () {
    test('audience geography benchmark recommendations', () {
      final dashboard = mockDashboard(plan: 'VIP');
      expect(dashboard['audience'], isNotNull);
      expect(dashboard['benchmark'], isNotNull);
      expect(dashboard['recommendations'], isNotNull);
      expect(ownerAnalyticsCap(dashboard, 'catalogAnalytics'), isTrue);
    });

    test('365-day period option', () {
      expect(ownerAnalyticsPeriodOptions(mockDashboard(plan: 'VIP')), [7, 30, 90, 365]);
    });

    test('popular hours ignores zero weekday rollup', () {
      final hours = ownerAnalyticsPopularHours(
        mockDashboard(plan: 'VIP')['popularTimes'] as Map<String, dynamic>,
      );
      expect(hours, hasLength(2));
      expect(hours.first['hour'], 18);
    });
  });

  group('intent actions keys', () {
    test('excludes promotionViews', () {
      expect(ownerAnalyticsIntentActionKeys, isNot(contains('promotionViews')));
      expect(ownerAnalyticsIntentActionKeys, hasLength(6));
    });
  });

  group('formatting', () {
    test('count formatting with spaces', () {
      expect(ownerAnalyticsFormatCount(1240), '1 240');
      expect(ownerAnalyticsFormatCount(null), '—');
    });

    test('rate percent formatting', () {
      expect(ownerAnalyticsFormatRatePercent(8.4), '8,4 %');
      expect(ownerAnalyticsFormatRatePercent(null), isNull);
    });

    test('delta percent text', () {
      expect(ownerAnalyticsDeltaPercent(18), '+18% к предыдущему периоду');
      expect(ownerAnalyticsDeltaPercent(-7), '-7% к предыдущему периоду');
      expect(ownerAnalyticsDeltaPercent(null), isNull);
    });
  });

  group('promotion and catalog actions unavailable', () {
    test('flags actionsAvailable false', () {
      expect(
        ownerAnalyticsPromotionActionsUnavailable(
          {'actionsAvailable': false},
        ),
        isTrue,
      );
      expect(
        ownerAnalyticsCatalogActionsUnavailable({'actionsAvailable': false}),
        isTrue,
      );
    });
  });

  group('empty state', () {
    test('detects zero views', () {
      final dashboard = mockDashboard(
        plan: 'FREE',
        overrides: {
          'overview': {'views': 0},
        },
      );
      expect(ownerAnalyticsIsEmpty(dashboard), isTrue);
    });
  });

  group('effective range sync', () {
    test('clamps requested days', () {
      final dashboard = mockDashboard(
        plan: 'FREE',
        overrides: {
          'effectiveRange': {'days': 30},
        },
      );
      expect(ownerAnalyticsEffectiveDays(dashboard, 365), 30);
    });
  });

  group('legacy JSON compatibility', () {
    test('minimal dashboard parses helpers', () {
      const legacy = {
        'capabilities': {'maxDays': 30, 'viewTrend': true},
        'lockedSections': [],
        'overview': {'views': 5},
        'trends': {
          'views': [
            {'date': '2026-01-01', 'count': 1},
          ],
        },
      };
      expect(ownerAnalyticsPeriodOptions(legacy), [7, 30]);
      expect(
        ownerAnalyticsTrendSeries(
          Map<String, dynamic>.from(legacy['trends'] as Map),
          'views',
        ),
        hasLength(1),
      );
    });
  });

  group('widget layout', () {
    testWidgets('overview grid fits narrow width', (tester) async {
      await tester.binding.setSurfaceSize(const Size(320, 640));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: OwnerAnalyticsOverviewGrid(dashboard: mockDashboard(plan: 'BASIC')),
            ),
          ),
        ),
      );

      expect(tester.takeException(), isNull);
    });
  });
}
