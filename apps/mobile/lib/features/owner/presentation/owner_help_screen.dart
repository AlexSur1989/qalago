import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_spacing.dart';
import 'widgets/owner_scaffold.dart';

const _faq = [
  (
    'Как пройти модерацию?',
    'Заполните профиль: название, адрес, описание, часы и минимум 3 фото. Проверка — до 24 часов.',
  ),
  (
    'Как ответить на отзыв?',
    'Откройте «Отзывы» в кабинете, выберите отзыв и напишите ответ.',
  ),
  (
    'Как добавить меню?',
    'В разделе «Меню» создайте группу и добавьте позиции с ценой.',
  ),
  (
    'Почему акция не в ленте?',
    'Акция должна быть активна, заведение опубликовано. В ленту попадают Pro и Топ города.',
  ),
  (
    'Чем отличаются тарифы?',
    'Базовый — 1 акция, 5 фото. Pro — VIP, до 5 акций, 2 в ленте. Топ — слот в топе, до 10 акций.',
  ),
  (
    'Что при истечении тарифа?',
    'Возврат на Базовый, снятие VIP. Уведомление придёт в «Сообщения».',
  ),
  (
    'Поддержка',
    'support@qalago.kz · WhatsApp +7 777 000 00 00 (MVP)',
  ),
];

class OwnerHelpScreen extends StatelessWidget {
  const OwnerHelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return OwnerScaffold(
      title: 'Помощь',
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Быстрый старт', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  const Text('1. Заполните профиль и загрузите фото'),
                  const Text('2. Добавьте меню или услуги'),
                  const Text('3. Создайте первую акцию'),
                  const Text('4. Смотрите статистику на главной'),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: () => context.push('/owner/plan'),
                    child: const Text('Тарифы и продвижение'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          ..._faq.map(
            (item) => Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ExpansionTile(
                title: Text(item.$1, style: const TextStyle(fontWeight: FontWeight.w600)),
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text(item.$2),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
