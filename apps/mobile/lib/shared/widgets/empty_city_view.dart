import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../features/auth/providers/auth_provider.dart';

class EmptyCityView extends ConsumerWidget {
  const EmptyCityView({
    super.key,
    required this.cityName,
    required this.onPickCity,
    this.compact = false,
    this.isComingSoon = false,
  });

  final String cityName;
  final VoidCallback onPickCity;
  final bool compact;
  final bool isComingSoon;

  void _openAddBusiness(BuildContext context, WidgetRef ref) {
    final auth = ref.read(authProvider);
    if (auth.isAuthenticated) {
      context.push('/owner/create-business');
      return;
    }
    context.push('/login');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final padding = compact ? 20.0 : 28.0;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(padding),
      decoration: BoxDecoration(
        color: AppTheme.kzBlue.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(compact ? 20 : 24),
        border: Border.all(color: AppTheme.kzBlue.withValues(alpha: 0.12)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: compact ? 56 : 72,
            height: compact ? 56 : 72,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.kzBlue.withValues(alpha: 0.12),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Icon(
              Icons.location_city_outlined,
              size: compact ? 30 : 36,
              color: AppTheme.kzBlue,
            ),
          ),
          SizedBox(height: compact ? 14 : 18),
          Text(
            isComingSoon ? '$cityName скоро откроется' : '$cityName скоро в QalaGo',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: compact ? 18 : 22,
              fontWeight: FontWeight.w700,
              color: AppTheme.textDark,
              height: 1.25,
            ),
          ),
          SizedBox(height: compact ? 8 : 10),
          Text(
            isComingSoon
                ? 'Мы готовим запуск города в QalaGo. Подключайте заведение заранее или выберите другой город.'
                : 'Мы добавляем заведения и услуги. Пока каталог пуст — выберите другой город или предложите своё место.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: compact ? 14 : 15,
              color: Colors.black.withValues(alpha: 0.62),
              height: 1.45,
            ),
          ),
          SizedBox(height: compact ? 18 : 22),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onPickCity,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.kzBlue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Выбрать другой город'),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => _openAddBusiness(context, ref),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.kzBlue,
                side: const BorderSide(color: AppTheme.kzBlue),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Добавить заведение'),
            ),
          ),
        ],
      ),
    );
  }
}
