import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';

class ProfileHelpScreen extends StatelessWidget {
  const ProfileHelpScreen({super.key});

  static const _supportEmail = 'support@qalago.kz';
  static const _supportPhone = '+7 (7112) 00-00-00';

  Future<void> _launch(Uri uri) async {
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch $uri');
    }
  }

  @override
  Widget build(BuildContext context) {
    const faq = [
      (
        'Как добавить заведение?',
        'В профиле выберите «Добавить заведение», заполните форму и дождитесь модерации.',
      ),
      (
        'Как сменить город?',
        'Профиль → «Мой город» или переключатель города на главной. Для аккаунта город сохраняется в облаке.',
      ),
      (
        'Как оставить отзыв?',
        'Откройте карточку заведения, прокрутите до блока отзывов и нажмите «Оставить отзыв».',
      ),
      (
        'Не приходит код входа',
        'В режиме разработки код показывается в ответе API. В продакшене проверьте номер и повторите через минуту.',
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
            'Связаться с нами',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          _ContactTile(
            icon: Icons.email_outlined,
            title: 'Email',
            subtitle: _supportEmail,
            onTap: () => _launch(Uri(scheme: 'mailto', path: _supportEmail)),
          ),
          const SizedBox(height: 8),
          _ContactTile(
            icon: Icons.phone_outlined,
            title: 'Телефон',
            subtitle: _supportPhone,
            onTap: () => _launch(Uri(scheme: 'tel', path: '+77112000000')),
          ),
          const SizedBox(height: 24),
          Text(
            'QalaGo — городской гид и маркетплейс. MVP запущен в Уральске.',
            style: TextStyle(
              color: Colors.black.withValues(alpha: 0.55),
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
                color: Colors.black.withValues(alpha: 0.65),
                height: 1.35,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  const _ContactTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.kzBlue.withValues(alpha: 0.06),
      borderRadius: BorderRadius.circular(16),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        leading: CircleAvatar(
          backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.12),
          child: Icon(icon, color: AppTheme.kzBlue),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.open_in_new, size: 20),
        onTap: () async {
          try {
            await onTap();
          } catch (e) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Не удалось открыть: $e')),
              );
            }
          }
        },
      ),
    );
  }
}
