import 'package:flutter/material.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';

class ProfileHelpScreen extends StatelessWidget {
  const ProfileHelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const faq = [
      (
        'Как добавить заведение?',
        'В профиле выберите «Добавить заведение», заполните форму и дождитесь модерации.',
      ),
      (
        'Как сменить город?',
        'Нажмите название города на главной или в профиле → «Мой город». Для аккаунта город сохраняется в облаке.',
      ),
      (
        'Как оставить отзыв?',
        'Откройте карточку заведения, прокрутите до блока отзывов и нажмите «Оставить отзыв».',
      ),
      (
        'Не приходит код входа',
        'Проверьте номер телефона и подождите минуту. Если код не пришёл, нажмите «Отправить снова» на экране входа.',
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Помощь')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          const Text(
            'Частые вопросы',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          ...faq.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _HelpCard(title: item.$1, body: item.$2),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Нужна помощь?',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          Material(
            color: AppTheme.kzBlue.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(16),
            child: const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Если у вас возникли вопросы по работе приложения, обратитесь в поддержку QalaGo через официальные каналы вашего города.',
                style: TextStyle(height: 1.4),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'QalaGo — городской гид и маркетплейс. MVP запущен в Уральске.',
            style: TextStyle(
              color: AppTheme.textDark.withValues(alpha: 0.55),
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _HelpCard extends StatelessWidget {
  const _HelpCard({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
            ),
            const SizedBox(height: 6),
            Text(
              body,
              style: TextStyle(
                color: AppTheme.textDark.withValues(alpha: 0.65),
                height: 1.35,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
