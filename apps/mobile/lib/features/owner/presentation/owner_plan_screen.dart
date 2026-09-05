import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/owner_providers.dart';
import 'widgets/owner_scaffold.dart';

class OwnerPlanScreen extends ConsumerStatefulWidget {
  const OwnerPlanScreen({super.key});

  @override
  ConsumerState<OwnerPlanScreen> createState() => _OwnerPlanScreenState();
}

class _OwnerPlanScreenState extends ConsumerState<OwnerPlanScreen> {
  String? _checkoutTier;
  String? _message;

  String _formatPrice(int price) {
    if (price == 0) return '0 ₸';
    return '${price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]} ')} ₸';
  }

  Future<void> _checkout(String businessId, String tier) async {
    setState(() {
      _checkoutTier = tier;
      _message = null;
    });
    try {
      final result =
          await ref.read(catalogRepositoryProvider).mockPlanCheckout(businessId, tier);
      setState(() => _message = result['message'] as String?);
      ref.invalidate(businessPlanProvider(businessId));
      ref.invalidate(ownerDashboardProvider(businessId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] as String? ?? 'Тариф обновлён')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _checkoutTier = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final business = ref.watch(ownerSelectedBusinessProvider);
    final catalogAsync = ref.watch(plansCatalogProvider);

    if (business == null) {
      return OwnerScaffold(
        title: 'Тариф',
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Сначала зарегистрируйте заведение'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => context.push('/owner/create-business'),
                child: const Text('Зарегистрировать'),
              ),
            ],
          ),
        ),
      );
    }

    final businessId = business['id'] as String;
    final planAsync = ref.watch(businessPlanProvider(businessId));

    return OwnerScaffold(
      title: 'Тариф и продвижение',
      body: catalogAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(plansCatalogProvider),
        ),
        data: (catalog) => planAsync.when(
          loading: () => const LoadingView(),
          error: (e, _) => ErrorView(
            message: '$e',
            onRetry: () => ref.invalidate(businessPlanProvider(businessId)),
          ),
          data: (planStatus) {
            final effectiveTier = planStatus['effectiveTier'] as String? ?? 'BASIC';
            final limits = planStatus['limits'] as Map<String, dynamic>? ?? {};
            final usage = planStatus['usage'] as Map<String, dynamic>? ?? {};
            final catalogInfo = planStatus['catalog'] as Map<String, dynamic>? ?? {};
            final maxPhotos = limits['maxPhotos'] as int?;
            final expiresAt = planStatus['expiresAt'] as String?;

            return ListView(
              padding: const EdgeInsets.all(AppSpacing.screen),
              children: [
                if (_message != null)
                  Card(
                    color: Colors.green.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(_message!),
                    ),
                  ),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Текущий: ${catalogInfo['nameRu'] ?? 'Базовый'}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Фото: ${usage['photos'] ?? 0}${maxPhotos != null ? ' / $maxPhotos' : ' · без лимита'}'
                          ' · Акции: ${usage['activePromotions'] ?? 0} / ${limits['maxActivePromotions'] ?? 1}'
                          ' · в ленте до ${limits['maxPromotionsInFeed'] ?? 0}',
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                        if (expiresAt != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'До ${DateTime.parse(expiresAt).toLocal().toString().split(' ').first}',
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.campaign_outlined, color: AppTheme.kzBlue),
                    title: const Text('Реклама и продвижение'),
                    subtitle: const Text('TOP, VIP-баннер, пакеты и статистика'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/owner/promote'),
                  ),
                ),
                const SizedBox(height: 12),
                ...catalog.map((plan) {
                  final tier = plan['tier'] as String? ?? '';
                  final isCurrent = effectiveTier == tier;
                  final price = (plan['priceKzt'] as num?)?.toInt() ?? 0;
                  final periodDays = plan['periodDays'] as int?;
                  final features = (plan['features'] as List<dynamic>? ?? [])
                      .cast<String>();
                  final isDowngrade = tier == 'BASIC' && effectiveTier != 'BASIC';

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: isCurrent ? AppTheme.kzBlue : Colors.grey.shade200,
                        width: isCurrent ? 2 : 1,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (isCurrent)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.kzBlue.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'Текущий тариф',
                                style: TextStyle(
                                  color: AppTheme.kzBlue,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          if (isCurrent) const SizedBox(height: 8),
                          Text(
                            plan['nameRu'] as String? ?? tier,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            '${_formatPrice(price)} / ${periodDays == null ? 'навсегда' : '$periodDays дн.'}',
                            style: TextStyle(color: Colors.grey.shade700),
                          ),
                          const SizedBox(height: 10),
                          ...features.map(
                            (f) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('• '),
                                  Expanded(child: Text(f)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          if (isCurrent)
                            const OutlinedButton(onPressed: null, child: Text('Активен'))
                          else
                            FilledButton(
                              onPressed: _checkoutTier == tier
                                  ? null
                                  : () => _checkout(businessId, tier),
                              child: Text(
                                _checkoutTier == tier
                                    ? 'Подключение…'
                                    : isDowngrade
                                        ? 'Вернуться на Базовый'
                                        : price == 0
                                            ? 'Выбрать'
                                            : 'Подключить (тест)',
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                }),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Тестовая оплата',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Оплата имитируется без списания. Тариф активируется на 30 дней.',
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                        const SizedBox(height: 10),
                        OutlinedButton(
                          onPressed: () => context.push('/owner/help'),
                          child: const Text('Перейти в «Помощь»'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
