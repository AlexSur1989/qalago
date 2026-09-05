import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../providers/owner_providers.dart';
import '../../presentation/widgets/owner_scaffold.dart';
import '../data/monetization_labels.dart';
import '../providers/monetization_providers.dart';
import '../widgets/monetization_widgets.dart';

class PromoteBusinessScreen extends ConsumerWidget {
  const PromoteBusinessScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = ref.watch(ownerSelectedBusinessProvider);
    if (business == null) {
      return const OwnerScaffold(
        title: 'Продвинуть бизнес',
        body: Center(child: Text('Сначала выберите заведение')),
      );
    }

    final businessId = business['id'] as String;
    final categoryId = business['categoryId'] as String?;
    final citySlug = business['city'] is Map
        ? (business['city'] as Map)['slug'] as String?
        : null;

    final productsAsync = ref.watch(
      monetizationProductsProvider((
        businessId: businessId,
        citySlug: citySlug,
        categoryId: categoryId,
      )),
    );
    final packagesAsync = ref.watch(monetizationPackagesProvider);

    return OwnerScaffold(
      title: 'Продвинуть бизнес',
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(monetizationProductsProvider);
          ref.invalidate(monetizationPackagesProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.screen),
          children: [
            Text(
              'Выберите способ продвижения',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 16),
            productsAsync.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                message: 'Не удалось получить цены. Проверьте подключение.',
                onRetry: () => ref.invalidate(monetizationProductsProvider),
              ),
              data: (products) {
                if (products.isEmpty) {
                  return const Text('Рекламные продукты временно недоступны.');
                }
                return Column(
                  children: products
                      .map(
                        (p) => MonetizationProductCard(
                          product: p,
                          onTap: () => context.push('/owner/promote/${p.code}'),
                        ),
                      )
                      .toList(),
                );
              },
            ),
            const SizedBox(height: 24),
            Text(
              'Готовые пакеты',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 12),
            packagesAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => ErrorView(
                message: 'Не удалось загрузить пакеты.',
                onRetry: () => ref.invalidate(monetizationPackagesProvider),
              ),
              data: (packages) => Column(
                children: packages
                    .map(
                      (pkg) => MonetizationPackageCard(
                        package: pkg,
                        onTap: () => context.push(
                          '/owner/promote/package/${pkg.code}',
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () => context.push('/owner/monetization/campaigns'),
              icon: const Icon(Icons.campaign_outlined),
              label: const Text('Мои продвижения'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => context.push('/owner/monetization/orders'),
              icon: const Icon(Icons.receipt_long_outlined),
              label: const Text('Мои заказы'),
            ),
          ],
        ),
      ),
    );
  }
}
