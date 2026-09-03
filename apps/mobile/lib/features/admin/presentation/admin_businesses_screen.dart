import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

class AdminBusinessesScreen extends ConsumerWidget {
  const AdminBusinessesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(adminPendingBusinessesProvider);
    final auth = ref.watch(authProvider);
    final cityName = ref.watch(adminModerationCityNameProvider);
    final isCityAdmin = auth.user?.role == 'CITY_ADMIN';
    final isPlatformAdmin = auth.user?.role == 'ADMIN';

    return Scaffold(
      appBar: AppBar(
        title: Text(isCityAdmin ? 'Модерация · $cityName' : 'Модерация'),
        actions: [
          if (isPlatformAdmin)
            IconButton(
              tooltip: 'Сменить город',
              onPressed: () => _pickCity(context, ref),
              icon: const Icon(Icons.location_city_outlined),
            ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.screen,
              AppSpacing.screen,
              AppSpacing.screen,
              0,
            ),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.kzBlue.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Icon(Icons.admin_panel_settings_outlined, color: AppTheme.kzBlue),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      isCityAdmin
                          ? 'Заявки только по городу $cityName'
                          : 'Заявки по городу: $cityName',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: pendingAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                message: '$e',
                onRetry: () => ref.invalidate(adminPendingBusinessesProvider),
              ),
              data: (items) {
                if (items.isEmpty) {
                  return Center(
                    child: Text('Нет заявок на модерацию в $cityName'),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(AppSpacing.screen),
                  itemCount: items.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(height: AppSpacing.item),
                  itemBuilder: (context, i) {
                    final b = items[i];
                    final id = b['id'] as String;
                    final title = b['title'] as String? ?? '';
                    final address = b['address'] as String? ?? '';
                    final city = b['city'] as Map<String, dynamic>?;
                    final cityLabel = city?['nameRu'] as String? ?? cityName;
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.screen),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    title,
                                    style:
                                        Theme.of(context).textTheme.titleMedium,
                                  ),
                                ),
                                Chip(
                                  label: Text(cityLabel),
                                  visualDensity: VisualDensity.compact,
                                ),
                              ],
                            ),
                            Text(address),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                FilledButton(
                                  onPressed: () async {
                                    await ref
                                        .read(adminRepositoryProvider)
                                        .updateBusinessStatus(id, 'ACTIVE');
                                    ref.invalidate(adminPendingBusinessesProvider);
                                    ref.invalidate(businessesProvider);
                                    ref.invalidate(featuredBusinessesProvider);
                                  },
                                  child: const Text('Одобрить'),
                                ),
                                const SizedBox(width: 8),
                                OutlinedButton(
                                  onPressed: () async {
                                    await ref
                                        .read(adminRepositoryProvider)
                                        .updateBusinessStatus(id, 'BLOCKED');
                                    ref.invalidate(adminPendingBusinessesProvider);
                                  },
                                  child: const Text('Отклонить'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickCity(BuildContext context, WidgetRef ref) async {
    final cities = await ref.read(citiesProvider.future);
    if (!context.mounted || cities.isEmpty) return;

    final selected = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: cities.map((city) {
            final slug = city['slug'] as String? ?? '';
            final name = city['nameRu'] as String? ?? slug;
            return ListTile(
              title: Text(name),
              onTap: () => Navigator.pop(ctx, city),
            );
          }).toList(),
        ),
      ),
    );

    if (selected == null) return;
    final slug = selected['slug'] as String? ?? '';
    final name = selected['nameRu'] as String? ?? slug;
    await ref.read(cityProvider.notifier).selectCity(slug, name);
    ref.invalidate(adminPendingBusinessesProvider);
    ref.invalidate(businessesProvider);
    ref.invalidate(featuredBusinessesProvider);
    ref.invalidate(promotionsProvider);
  }
}
