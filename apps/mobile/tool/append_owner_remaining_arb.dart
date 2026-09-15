// ignore_for_file: avoid_print
import 'dart:convert';
import 'dart:io';

void main() {
  _merge('lib/l10n/app_ru.arb', _ru());
  _merge('lib/l10n/app_kk.arb', _kk());
  print('Added remaining owner UI keys.');
}

void _merge(String path, Map<String, dynamic> entries) {
  final file = File(path);
  final decoded = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  decoded.addAll(entries);
  file.writeAsStringSync('${const JsonEncoder.withIndent('  ').convert(decoded)}\n');
}

Map<String, dynamic> _ru() => {
      'ownerHelpQuickStart': 'Быстрый старт',
      'ownerHelpStep1': '1. Заполните профиль и загрузите фото',
      'ownerHelpStep2': '2. Добавьте меню или услуги',
      'ownerHelpStep3': '3. Создайте первую акцию',
      'ownerHelpStep4': '4. Смотрите статистику на главной',
      'ownerHelpPlansPromote': 'Тарифы и продвижение',
      'ownerTeamInvitationTitle': 'Приглашение в команду',
      'ownerInvitationForEmail': 'Для: {email}',
      'ownerMenuNewGroup': 'Новая группа',
      'ownerMenuEditGroup': 'Редактировать группу',
      'ownerMenuGroupNameLabel': 'Название группы *',
      'ownerMenuGroupNameHint': 'Например: Горячие блюда, Стрижка',
      'ownerMenuNewItem': 'Новая позиция',
      'ownerMenuGroupField': 'Группа',
      'ownerMenuNoGroup': 'Без группы',
      'ownerMenuPriceLabel': 'Цена (₸)',
      'ownerCatalogServicesTitle': 'Товары и услуги · {title}',
      'ownerMenuAddGroup': 'Группа',
      'ownerMenuAddItem': 'Позиция',
      'ownerMenuNoSection': 'Без раздела',
      'ownerMenuHideItem': 'Скрыть',
      'ownerMenuShowItem': 'Показать',
      'ownerPlanPurchaseUnavailable': 'Покупка недоступна',
      'ownerPlanGoToAds': 'Перейти к рекламе',
      'ownerScheduledRange': '{start} — {end}',
      '@ownerScheduledRange': {
        'placeholders': {
          'start': {'type': 'String'},
          'end': {'type': 'String'},
        }
      },
      '@ownerInvitationForEmail': {
        'placeholders': {'email': {'type': 'String'}}
      },
      '@ownerCatalogServicesTitle': {
        'placeholders': {'title': {'type': 'String'}}
      },
    };

Map<String, dynamic> _kk() => {
      'ownerHelpQuickStart': 'Жылдам бастау',
      'ownerHelpStep1': '1. Профильді толтырып, фото жүктеңіз',
      'ownerHelpStep2': '2. Мәзір немесе қызметтер қосыңыз',
      'ownerHelpStep3': '3. Алғашқы акция жасаңыз',
      'ownerHelpStep4': '4. Негізгі беттегі статистиканы қараңыз',
      'ownerHelpPlansPromote': 'Тарифтер мен насихат',
      'ownerTeamInvitationTitle': 'Командға шақыру',
      'ownerInvitationForEmail': 'Кімге: {email}',
      'ownerMenuNewGroup': 'Жаңа топ',
      'ownerMenuEditGroup': 'Топты өңдеу',
      'ownerMenuGroupNameLabel': 'Топ атауы *',
      'ownerMenuGroupNameHint': 'Мысалы: Ыстық тағамдар, Шаш кесу',
      'ownerMenuNewItem': 'Жаңа позиция',
      'ownerMenuGroupField': 'Топ',
      'ownerMenuNoGroup': 'Топсыз',
      'ownerMenuPriceLabel': 'Баға (₸)',
      'ownerCatalogServicesTitle': 'Тауарлар мен қызметтер · {title}',
      'ownerMenuAddGroup': 'Топ',
      'ownerMenuAddItem': 'Позиция',
      'ownerMenuNoSection': 'Бөлімсіз',
      'ownerMenuHideItem': 'Жасыру',
      'ownerMenuShowItem': 'Көрсету',
      'ownerPlanPurchaseUnavailable': 'Сатып алу қолжетімсіз',
      'ownerPlanGoToAds': 'Жарнамаға өту',
      'ownerScheduledRange': '{start} — {end}',
      '@ownerScheduledRange': {
        'placeholders': {
          'start': {'type': 'String'},
          'end': {'type': 'String'},
        }
      },
      '@ownerInvitationForEmail': {
        'placeholders': {'email': {'type': 'String'}}
      },
      '@ownerCatalogServicesTitle': {
        'placeholders': {'title': {'type': 'String'}}
      },
    };
