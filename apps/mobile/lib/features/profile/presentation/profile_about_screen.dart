import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';

class ProfileAboutScreen extends StatelessWidget {
  const ProfileAboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('О приложении')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 44,
                  backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.12),
                  child: RichText(
                    text: const TextSpan(
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                      ),
                      children: [
                        TextSpan(
                          text: 'Q',
                          style: TextStyle(color: Colors.black),
                        ),
                        TextSpan(
                          text: 'G',
                          style: TextStyle(color: AppTheme.kzBlue),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  AppConstants.appName,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Версия 1.0.0 (MVP)',
                  style: TextStyle(
                    color: Colors.black.withValues(alpha: 0.5),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          const Text(
            'QalaGo — городской super-app: каталог заведений, акции, карта, отзывы и кабинет для бизнеса.',
            style: TextStyle(height: 1.45, fontSize: 15),
          ),
          const SizedBox(height: 20),
          _AboutRow(
            icon: Icons.location_city_outlined,
            title: 'Город MVP',
            value: 'Уральск',
          ),
          _AboutRow(
            icon: Icons.public_outlined,
            title: 'Регион',
            value: 'Казахстан',
          ),
          _AboutRow(
            icon: Icons.language_outlined,
            title: 'Языки',
            value: 'Русский (kk — скоро)',
          ),
          const SizedBox(height: 24),
          Text(
            '© ${DateTime.now().year} QalaGo. Все права защищены.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.black.withValues(alpha: 0.45),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _AboutRow extends StatelessWidget {
  const _AboutRow({
    required this.icon,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        elevation: 1,
        shadowColor: Colors.black.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(14),
        child: ListTile(
          leading: Icon(icon, color: AppTheme.kzBlue),
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
          trailing: Text(
            value,
            style: TextStyle(
              color: Colors.black.withValues(alpha: 0.65),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
