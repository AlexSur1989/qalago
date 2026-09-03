import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

class OwnerDashboardScreen extends ConsumerWidget {
  const OwnerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final businessesAsync = ref.watch(myBusinessesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Кабинет бизнеса')),
      body: businessesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(myBusinessesProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('Нет заведений'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.screen),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.item),
            itemBuilder: (context, i) {
              final b = items[i];
              final model = BusinessModel.fromJson(b);
              final status = b['status'] as String? ?? '';
              final encodedTitle = Uri.encodeComponent(model.title);
              return Card(
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => context.push('/business/${model.id}'),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    model.title,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '$status · ${model.address}',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                  if (status == 'PENDING') ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      'Ожидает модерации — гости увидят после одобления',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: Colors.orange.shade800,
                                          ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const Icon(Icons.chevron_right, color: Colors.black38),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.tonalIcon(
                            onPressed: () => context.push(
                              '/owner/edit/${model.id}?title=$encodedTitle',
                            ),
                            icon: const Icon(Icons.storefront_outlined, size: 18),
                            label: const Text('Профиль'),
                          ),
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.tonalIcon(
                            onPressed: () => context.push(
                              '/owner/menu/${model.id}?title=$encodedTitle',
                            ),
                            icon: const Icon(Icons.restaurant_menu, size: 18),
                            label: const Text('Меню'),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => context.push(
                                  '/owner/gallery/${model.id}?title=$encodedTitle',
                                ),
                                icon: const Icon(Icons.photo_library_outlined, size: 18),
                                label: const Text('Галерея'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => context.push(
                                  '/owner/analytics/${model.id}?title=$encodedTitle',
                                ),
                                icon: const Icon(Icons.bar_chart_outlined, size: 18),
                                label: const Text('Статистика'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () => context.push(
                              '/owner/promotions/${model.id}?title=$encodedTitle',
                            ),
                            icon: const Icon(Icons.local_offer_outlined, size: 18),
                            label: const Text('Акции'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/owner/create-business'),
        label: const Text('Добавить заведение'),
        icon: const Icon(Icons.add_business),
      ),
    );
  }
}
