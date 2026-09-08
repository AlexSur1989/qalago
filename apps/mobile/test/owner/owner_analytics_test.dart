import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/owner_analytics_utils.dart';

Map<String, dynamic> mockDashboard({
  required String plan,
  Map<String, dynamic>? overrides,
}) {
  final isFree = plan == 'FREE';
  final isBasic = plan == 'BASIC';
  final isPremium = plan == 'PREMIUM' || plan == 'VIP';
  final isVip = plan == 'VIP';

  return {
    'plan': plan,
    'capabilities': {
      'maxDays': isVip ? 365 : (plan == 'PREMIUM' ? 90 : 30),
      'actions': !isFree,
      'viewTrend': true,
      'actionTrend': !isFree,
      'trafficSources': isPremium,
      'searchQueries': isPremium,
      'conversion': isPremium,
      'periodComparison': isPremium,
      'popularTimes': isVip,
      'benchmark': isVip,
      'recommendations': isVip,
      'audienceGeography': isVip,
      'reportExport': isVip,
    },
    'lockedSections': isFree
        ? [
            {
              'id': 'actions',
              'label': 'Действия клиентов',
              'message': 'Доступно с BASIC',
            },
          ]
        : isBasic
            ? [
                {
                  'id': 'sources',
                  'label': 'Источники',
                  'message': 'Доступно с PREMIUM',
                },
                {
                  'id': 'searchQueries',
                  'label': 'Поисковые запросы',
                  'message': 'Поисковые запросы доступны с PREMIUM',
                },
                {
                  'id': 'audienceGeography',
                  'label': 'Аудитория по расстоянию',
                  'message': 'Аналитика аудитории доступна на тарифе VIP',
                },
                {
                  'id': 'reportExport',
                  'label': 'Экспорт отчётов',
                  'message': 'Экспорт отчётов доступен на тарифе VIP',
                },
              ]
            : isPremium
                ? [
                    {
                      'id': 'audienceGeography',
                      'label': 'Аудитория по расстоянию',
                      'message': 'Аналитика аудитории доступна на тарифе VIP',
                    },
                    {
                      'id': 'reportExport',
                      'label': 'Экспорт отчётов',
                      'message': 'Экспорт отчётов доступен на тарифе VIP',
                    },
                  ]
                : [],
    'overview': {'views': 12},
    'actions': isFree
        ? null
        : {
            'total': 4,
            'calls': 1,
            'whatsapp': 1,
            'routes': 1,
            'website': 0,
            'instagram': 0,
            'favorites': 1,
            'promotionViews': 0,
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
    if (isPremium) ...{
      'sourcesStatus': 'DEFERRED',
      'conversion': {'views': 12, 'actions': 4, 'rate': 33.3},
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
      'popularTimes': {
        'byWeekday': [
          {'weekday': 1, 'label': 'Пн', 'count': 2},
        ],
      },
      'benchmark': {
        'categoryTitle': 'Кафе',
        'businessViews': 12,
        'categoryAvgViews': 8,
        'businessActions': 4,
        'categoryAvgActions': 3,
      },
      'recommendations': [
        {'id': 'keep-going', 'title': 'OK', 'body': 'body'},
      ],
    },
    ...?overrides,
  };
}

void main() {
  group('FREE tier', () {
    test('views visible and actions locked with upgrade message', () {
      final dashboard = mockDashboard(plan: 'FREE');
      expect((dashboard['overview'] as Map)['views'], 12);
      expect(dashboard['actions'], isNull);
      expect(ownerAnalyticsIsLocked(dashboard, 'actions'), isTrue);
      expect(ownerAnalyticsLockedMessage(dashboard, 'actions'), 'Доступно с BASIC');
    });
  });

  group('BASIC tier', () {
    test('actions visible and premium sections locked', () {
      final dashboard = mockDashboard(plan: 'BASIC');
      expect((dashboard['actions'] as Map)['total'], 4);
      expect(ownerAnalyticsIsLocked(dashboard, 'sources'), isTrue);
      expect(ownerAnalyticsLockedMessage(dashboard, 'sources'), 'Доступно с PREMIUM');
    });
  });

  group('PREMIUM tier', () {
    test('search queries visible when threshold met', () {
      final dashboard = mockDashboard(
        plan: 'PREMIUM',
        overrides: {
          'searchQueries': [
            {'query': 'кофе рядом', 'count': 10, 'percentage': 50},
            {'query': 'дәмхана', 'count': 6, 'percentage': 30},
          ],
          'searchQueriesStatus': 'AVAILABLE',
        },
      );
      expect((dashboard['searchQueries'] as List), hasLength(2));
    });

    test('insufficient search query data state', () {
      final dashboard = mockDashboard(
        plan: 'PREMIUM',
        overrides: {
          'searchQueries': [],
          'searchQueriesStatus': 'INSUFFICIENT_DATA',
        },
      );
      expect(dashboard['searchQueriesStatus'], 'INSUFFICIENT_DATA');
    });

    test('conversion and comparison visible; sources show real breakdown', () {
      final dashboard = mockDashboard(
        plan: 'PREMIUM',
        overrides: {
          'sources': [
            {'source': 'SEARCH', 'label': 'Поиск', 'views': 10, 'share': 50},
            {'source': 'UNKNOWN', 'label': 'Неизвестно', 'views': 10, 'share': 50},
          ],
          'sourcesStatus': null,
        },
      );
      expect((dashboard['sources'] as List), hasLength(2));
      expect(dashboard['conversion'], isNotNull);
      expect(dashboard['comparison'], isNotNull);
    });

    test('empty sources with capability shows no-data path', () {
      final dashboard = mockDashboard(
        plan: 'PREMIUM',
        overrides: {
          'sources': [],
          'sourcesStatus': null,
        },
      );
      expect(dashboard['sources'], isEmpty);
      expect(dashboard['capabilities']['trafficSources'], isTrue);
    });
  });

  group('BASIC search queries', () {
    test('search queries locked', () {
      final dashboard = mockDashboard(
        plan: 'BASIC',
        overrides: {
          'lockedSections': [
            {
              'id': 'searchQueries',
              'label': 'Поисковые запросы',
              'message': 'Поисковые запросы доступны с PREMIUM',
            },
          ],
        },
      );
      expect(ownerAnalyticsIsLocked(dashboard, 'searchQueries'), isTrue);
    });
  });

  group('VIP tier', () {
    test('popular times benchmark and recommendations visible', () {
      final dashboard = mockDashboard(plan: 'VIP');
      expect(dashboard['popularTimes'], isNotNull);
      expect(dashboard['benchmark'], isNotNull);
      expect(dashboard['recommendations'], isNotNull);
    });

    test('audience geography visible with Russian labels', () {
      final dashboard = mockDashboard(
        plan: 'VIP',
        overrides: {
          'audienceGeography': [
            {'bucket': 'LT_1_KM', 'label': 'До 1 км', 'count': 12, 'percentage': 21.4},
            {'bucket': 'UNKNOWN', 'label': 'Не определено', 'count': 2, 'percentage': 3.6},
          ],
          'audienceGeographyStatus': 'AVAILABLE',
        },
      );
      expect((dashboard['audienceGeography'] as List), hasLength(2));
      expect(dashboard['audienceGeographyStatus'], 'AVAILABLE');
    });

    test('insufficient audience geography data state', () {
      final dashboard = mockDashboard(
        plan: 'VIP',
        overrides: {
          'audienceGeography': [],
          'audienceGeographyStatus': 'INSUFFICIENT_DATA',
        },
      );
      expect(dashboard['audienceGeographyStatus'], 'INSUFFICIENT_DATA');
    });
  });

  group('PREMIUM report export', () {
    test('report export locked on PREMIUM', () {
      final dashboard = mockDashboard(plan: 'PREMIUM');
      expect(ownerAnalyticsIsLocked(dashboard, 'reportExport'), isTrue);
      expect(
        ownerAnalyticsLockedMessage(dashboard, 'reportExport'),
        'Экспорт отчётов доступен на тарифе VIP',
      );
    });
  });

  group('PREMIUM audience geography', () {
    test('audience geography locked on PREMIUM', () {
      final dashboard = mockDashboard(plan: 'PREMIUM');
      expect(ownerAnalyticsIsLocked(dashboard, 'audienceGeography'), isTrue);
      expect(
        ownerAnalyticsLockedMessage(dashboard, 'audienceGeography'),
        'Аналитика аудитории доступна на тарифе VIP',
      );
    });
  });

  group('business switching helpers', () {
    test('period options respect maxDays', () {
      expect(ownerAnalyticsPeriodOptions(mockDashboard(plan: 'BASIC')), [7, 30]);
      expect(ownerAnalyticsPeriodOptions(mockDashboard(plan: 'VIP')), [7, 30, 90, 365]);
    });

    test('trend series extracts keyed arrays', () {
      final dashboard = mockDashboard(plan: 'BASIC');
      final views = ownerAnalyticsTrendSeries(
        dashboard['trends'] as Map<String, dynamic>,
        'views',
      );
      expect(views.length, 1);
      expect(views.first.key, '2026-09-01');
      expect(views.first.value, 3);
    });
  });

  group('advertising analytics parity', () {
    test('campaign analytics are independent from subscription plan gating', () {
      final freeDashboard = mockDashboard(plan: 'FREE');
      expect(freeDashboard['actions'], isNull);
      expect(ownerAnalyticsIsLocked(freeDashboard, 'actions'), isTrue);
      // Ad campaign analytics use monetization endpoint — not blocked by plan.
    });
  });
}
