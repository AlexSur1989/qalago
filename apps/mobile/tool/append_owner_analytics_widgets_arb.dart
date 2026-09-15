// ignore_for_file: avoid_print
import 'dart:convert';
import 'dart:io';

void main() {
  _merge('lib/l10n/app_ru.arb', _ru());
  _merge('lib/l10n/app_kk.arb', _kk());
  print('Added owner analytics widget keys.');
}

void _merge(String path, Map<String, dynamic> entries) {
  final file = File(path);
  final decoded = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  decoded.addAll(entries);
  file.writeAsStringSync('${const JsonEncoder.withIndent('  ').convert(decoded)}\n');
}

Map<String, dynamic> _ru() => {
      'ownerAnalyticsCardViews': 'Просмотры карточки',
      'ownerAnalyticsImpressionsLabel': 'Показы',
      'ownerAnalyticsConversionTitle': 'Конверсия в действие',
      'ownerAnalyticsConversionHint':
          'Доля просмотров карточки, после которых пользователь совершил целевое действие: звонок, WhatsApp, маршрут, сайт, Instagram или добавление в избранное.',
      'ownerAnalyticsChartViewsDays': 'Просмотры за {days} дн.',
      'ownerAnalyticsChartActionsDays': 'Действия за {days} дн.',
      'ownerAnalyticsFunnelStepImpressions': '{count} показов',
      'ownerAnalyticsFunnelStepViews': '{count} просмотров',
      'ownerAnalyticsFunnelStepActions': '{count} целевых действий',
      'ownerAnalyticsPeriodFunnel': 'Воронка периода',
      'ownerAnalyticsConversionLine': 'Конверсия в действие: {value}',
      'ownerAnalyticsAggregatedNote':
          'Показатели рассчитаны по агрегированным данным периода.',
      'ownerAnalyticsVsPreviousPeriod': 'К предыдущему периоду',
      'ownerAnalyticsPopularHours': 'Популярное время',
      'ownerAnalyticsAudience': 'Аудитория',
      'ownerAnalyticsAudienceSubtitle': 'Доли просмотров карточки по типу посетителя',
      'ownerAnalyticsNewVisitors': 'Новые посетители',
      'ownerAnalyticsReturningVisitors': 'Вернувшиеся посетители',
      'ownerAnalyticsAudienceDistanceEmpty':
          'Недостаточно данных для анализа аудитории по расстоянию',
      'ownerAnalyticsViewsShare': 'Доля просмотров: {share}',
      'ownerAnalyticsUniqueVisitors': 'Уникальные посетители',
      'ownerAnalyticsSessions': 'Сессии',
      'ownerAnalyticsDailyUniqueSum': 'Суммарно уникальных посетителей по дням',
      'ownerAnalyticsDailySessionsSum': 'Суммарно сессий по дням',
      'ownerAnalyticsDistanceTitle': 'Расстояние до заведения',
      'ownerAnalyticsDistanceHint':
          'Агрегированные интервалы без точных координат пользователей.',
      'ownerAnalyticsContentSection': 'Контент',
      'ownerAnalyticsPromotionViewsLine': 'Просмотры акций: {count}',
      'ownerAnalyticsPromotionItemTitle': 'Акция · {id}',
      'ownerAnalyticsPromotionActionsNotMeasured': 'Действия по акциям пока не измеряются',
      'ownerAnalyticsCatalogSection': 'Каталог',
      'ownerAnalyticsCatalogItemTitle': 'Позиция · {id}',
      'ownerAnalyticsCatalogItemEmpty': 'Позиция',
      'ownerAnalyticsCatalogActionsNotMeasured':
          'Действия по позициям каталога пока не измеряются',
      'ownerAnalyticsStatsAfterFirstView':
          'Статистика появится после первых просмотров карточки.',
      'ownerAnalyticsSegmentViews': 'Просмотры',
      'ownerAnalyticsSegmentActions': 'Действия',
      '@ownerAnalyticsChartViewsDays': {
        'placeholders': {'days': {'type': 'int'}}
      },
      '@ownerAnalyticsChartActionsDays': {
        'placeholders': {'days': {'type': 'int'}}
      },
      '@ownerAnalyticsFunnelStepImpressions': {
        'placeholders': {'count': {'type': 'String'}}
      },
      '@ownerAnalyticsFunnelStepViews': {
        'placeholders': {'count': {'type': 'String'}}
      },
      '@ownerAnalyticsFunnelStepActions': {
        'placeholders': {'count': {'type': 'String'}}
      },
      '@ownerAnalyticsConversionLine': {
        'placeholders': {'value': {'type': 'String'}}
      },
      '@ownerAnalyticsViewsShare': {
        'placeholders': {'share': {'type': 'String'}}
      },
      '@ownerAnalyticsPromotionViewsLine': {
        'placeholders': {'count': {'type': 'String'}}
      },
      '@ownerAnalyticsPromotionItemTitle': {
        'placeholders': {'id': {'type': 'String'}}
      },
      '@ownerAnalyticsCatalogItemTitle': {
        'placeholders': {'id': {'type': 'String'}}
      },
    };

Map<String, dynamic> _kk() => {
      'ownerAnalyticsCardViews': 'Карточка қараулары',
      'ownerAnalyticsImpressionsLabel': 'Көрсетулер',
      'ownerAnalyticsConversionTitle': 'Әрекетке конверсия',
      'ownerAnalyticsConversionHint':
          'Карточканы қарағаннан кейін қоңырау, WhatsApp, бағыт, сайт, Instagram немесе таңдаулыға қосу сияқты мақсатты әрекет жасаған пайдаланушылар үлесі.',
      'ownerAnalyticsChartViewsDays': '{days} күндегі қараулар',
      'ownerAnalyticsChartActionsDays': '{days} күндегі әрекеттер',
      'ownerAnalyticsFunnelStepImpressions': '{count} көрсету',
      'ownerAnalyticsFunnelStepViews': '{count} қарау',
      'ownerAnalyticsFunnelStepActions': '{count} мақсатты әрекет',
      'ownerAnalyticsPeriodFunnel': 'Кезеңнің воронкасы',
      'ownerAnalyticsConversionLine': 'Әрекетке конверсия: {value}',
      'ownerAnalyticsAggregatedNote': 'Көрсеткіштер кезеңнің агрегатталған деректері бойынша есептелген.',
      'ownerAnalyticsVsPreviousPeriod': 'Алдыңғы кезеңге салыстырғанда',
      'ownerAnalyticsPopularHours': 'Танымал уақыт',
      'ownerAnalyticsAudience': 'Аудитория',
      'ownerAnalyticsAudienceSubtitle': 'Карточка қарауларының келуші түрі бойынша үлесі',
      'ownerAnalyticsNewVisitors': 'Жаңа келушілер',
      'ownerAnalyticsReturningVisitors': 'Қайта келгендер',
      'ownerAnalyticsAudienceDistanceEmpty':
          'Қашықтық бойынша аудиторияны талдауға деректер жеткіліксіз',
      'ownerAnalyticsViewsShare': 'Қараулар үлесі: {share}',
      'ownerAnalyticsUniqueVisitors': 'Бірегей келушілер',
      'ownerAnalyticsSessions': 'Сессиялар',
      'ownerAnalyticsDailyUniqueSum': 'Күн бойынша бірегей келушілер жиыны',
      'ownerAnalyticsDailySessionsSum': 'Күн бойынша сессиялар жиыны',
      'ownerAnalyticsDistanceTitle': 'Орынға дейінгі қашықтық',
      'ownerAnalyticsDistanceHint':
          'Пайдаланушылардың нақты координаттарынсыз агрегатталған интервалдар.',
      'ownerAnalyticsContentSection': 'Контент',
      'ownerAnalyticsPromotionViewsLine': 'Акция қараулары: {count}',
      'ownerAnalyticsPromotionItemTitle': 'Акция · {id}',
      'ownerAnalyticsPromotionActionsNotMeasured': 'Акциялар бойынша әрекеттер әлі өлшенбейді',
      'ownerAnalyticsCatalogSection': 'Кatalog',
      'ownerAnalyticsCatalogItemTitle': 'Позиция · {id}',
      'ownerAnalyticsCatalogItemEmpty': 'Позиция',
      'ownerAnalyticsCatalogActionsNotMeasured':
          'Кatalog позициялары бойынша әрекеттер әлі өлшенбейді',
      'ownerAnalyticsStatsAfterFirstView':
          'Карточканың алғашқы қарауларынан кейін статистика пайда болады.',
      'ownerAnalyticsSegmentViews': 'Қараулар',
      'ownerAnalyticsSegmentActions': 'Әрекеттер',
      '@ownerAnalyticsChartViewsDays': {
        'placeholders': {'days': {'type': 'int'}}
      },
      '@ownerAnalyticsChartActionsDays': {
        'placeholders': {'days': {'type': 'int'}}
      },
      '@ownerAnalyticsFunnelStepImpressions': {
        'placeholders': {'count': {'type': 'String'}}
      },
      '@ownerAnalyticsFunnelStepViews': {
        'placeholders': {'count': {'type': 'String'}}
      },
      '@ownerAnalyticsFunnelStepActions': {
        'placeholders': {'count': {'type': 'String'}}
      },
      '@ownerAnalyticsConversionLine': {
        'placeholders': {'value': {'type': 'String'}}
      },
      '@ownerAnalyticsViewsShare': {
        'placeholders': {'share': {'type': 'String'}}
      },
      '@ownerAnalyticsPromotionViewsLine': {
        'placeholders': {'count': {'type': 'String'}}
      },
      '@ownerAnalyticsPromotionItemTitle': {
        'placeholders': {'id': {'type': 'String'}}
      },
      '@ownerAnalyticsCatalogItemTitle': {
        'placeholders': {'id': {'type': 'String'}}
      },
    };
