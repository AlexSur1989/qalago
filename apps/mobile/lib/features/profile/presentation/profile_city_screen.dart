import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileCityScreen extends ConsumerWidget {
  const ProfileCityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final citiesAsync = ref.watch(citiesProvider);
    final currentCity = ref.watch(cityProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Мой город')),
      body: citiesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(citiesProvider),
        ),
        data: (cities) {
          if (cities.isEmpty) {
            return const Center(child: Text('Города не найдены'));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.screen),
            itemCount: cities.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final city = cities[index];
              final slug = city['slug'] as String? ?? '';
              final name = city['nameRu'] as String? ?? slug;
              final id = city['id'] as String? ?? '';
              final isSelected = currentCity.slug == slug;

              return Card(
                color: isSelected ? AppTheme.kzBlue.withValues(alpha: 0.08) : null,
                child: ListTile(
                  leading: Icon(
                    Icons.location_city_outlined,
                    color: isSelected ? AppTheme.kzBlue : Colors.black54,
                  ),
                  title: Text(
                    name,
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                      color: isSelected ? AppTheme.kzBlue : Colors.black,
                    ),
                  ),
                  subtitle: Text(
                    isSelected ? 'Текущий город' : 'Нажмите, чтобы выбрать',
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check_circle, color: AppTheme.kzBlue)
                      : const Icon(Icons.chevron_right),
                  onTap: () async {
                    if (id.isEmpty) return;
                    try {
                      await ref.read(authProvider.notifier).setPreferredCity(
                            cityId: id,
                            slug: slug,
                            nameRu: name,
                          );
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Город: $name')),
                        );
                        Navigator.pop(context);
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Ошибка: $e')),
                        );
                      }
                    }
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
