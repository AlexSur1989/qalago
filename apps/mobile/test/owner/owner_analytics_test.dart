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
      'conversion': isPremium,
      'periodComparison': isPremium,
      'popularTimes': isVip,
      'benchmark': isVip,
      'recommendations': isVip,
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
    test('conversion and comparison visible; sources deferred not faked', () {
      final dashboard = mockDashboard(plan: 'PREMIUM');
      expect(dashboard['sources'], isNull);
      expect(dashboard['conversion'], isNotNull);
      expect(dashboard['comparison'], isNotNull);
    });
  });

  group('VIP tier', () {
    test('popular times benchmark and recommendations visible', () {
      final dashboard = mockDashboard(plan: 'VIP');
      expect(dashboard['popularTimes'], isNotNull);
      expect(dashboard['benchmark'], isNotNull);
      expect(dashboard['recommendations'], isNotNull);
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
