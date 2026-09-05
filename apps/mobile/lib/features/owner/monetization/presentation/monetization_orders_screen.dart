import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/error_view.dart';
import '../../../../shared/widgets/loading_view.dart';
import '../../presentation/widgets/owner_scaffold.dart';
import '../../providers/owner_providers.dart';
import '../data/monetization_formatters.dart';
import '../data/monetization_labels.dart';
import '../data/monetization_models.dart';
import '../providers/monetization_providers.dart';
import '../widgets/monetization_widgets.dart';

class MonetizationOrdersScreen extends ConsumerWidget {
  const MonetizationOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = ref.watch(ownerSelectedBusinessProvider);
    if (business == null) {
      return const OwnerScaffold(
        title: 'Мои заказы',
        body: Center(child: Text('Заведение не выбрано')),
      );
    }
    final businessId = business['id'] as String;
    final ordersAsync = ref.watch(ownerMonetizationOrdersProvider(businessId));

    return OwnerScaffold(
      title: 'Мои заказы',
      body: ordersAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: 'Не удалось загрузить заказы.',
          onRetry: () => ref.invalidate(ownerMonetizationOrdersProvider(businessId)),
        ),
        data: (orders) {
          if (orders.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async =>
                  ref.invalidate(ownerMonetizationOrdersProvider(businessId)),
              child: ListView(
                children: const [
                  SizedBox(height: 120),
                  Center(child: Text('У вас пока нет заказов')),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async =>
                ref.invalidate(ownerMonetizationOrdersProvider(businessId)),
            child: ListView.builder(
              padding: const EdgeInsets.all(AppSpacing.screen),
              itemCount: orders.length,
              itemBuilder: (context, index) {
                final order = orders[index];
                final productName = order.items.isNotEmpty
                    ? order.items.first.productName
                    : 'Заказ';
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: ListTile(
                    title: Text(order.orderNumber),
                    subtitle: Text(
                      '$productName\n${formatKztPrice(order.totalAmount)} · ${orderStatusLabel(order.status)}',
                    ),
                    isThreeLine: true,
                    trailing: Text(
                      formatMonetizationDate(order.createdAt),
                      style: const TextStyle(fontSize: 12),
                    ),
                    onTap: () =>
                        context.push('/owner/monetization/orders/${order.id}'),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class MonetizationOrderDetailScreen extends ConsumerWidget {
  const MonetizationOrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(ownerMonetizationOrderProvider(orderId));
    final business = ref.watch(ownerSelectedBusinessProvider);

    return OwnerScaffold(
      title: 'Заказ',
      body: orderAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: 'Заказ не найден.',
          onRetry: () => ref.invalidate(ownerMonetizationOrderProvider(orderId)),
        ),
        data: (order) {
          final productName =
              order.items.isNotEmpty ? order.items.first.productName : 'Заказ';
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.screen),
            children: [
              const Text(
                'Заказ создан',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 22),
              ),
              const SizedBox(height: 12),
              Text('№ ${order.orderNumber}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              Text(productName, style: const TextStyle(fontWeight: FontWeight.w700)),
              if (order.items.isNotEmpty &&
                  order.items.first.durationDays != null)
                Text(
                  formatDurationLabel(
                    durationDays: order.items.first.durationDays,
                  ),
                ),
              const SizedBox(height: 20),
              Text('К оплате:', style: TextStyle(color: Colors.grey.shade700)),
              Text(
                formatKztPrice(order.totalAmount),
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.kzBlue,
                ),
              ),
              const SizedBox(height: 12),
              MonetizationStatusChip(
                label: orderStatusLabel(order.status),
                color: order.status == 'AWAITING_PAYMENT'
                    ? Colors.orange.shade800
                    : AppTheme.kzBlue,
              ),
              const SizedBox(height: 24),
              const Text(
                paymentInfoNotice,
                style: TextStyle(height: 1.4),
              ),
              const SizedBox(height: 12),
              Text(
                paymentMethodUnavailableNotice,
                style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
              ),
              const SizedBox(height: 24),
              OutlinedButton(
                onPressed: business == null
                    ? null
                    : () {
                        ref.invalidate(
                          ownerMonetizationOrdersProvider(
                            business['id'] as String,
                          ),
                        );
                        ref.invalidate(ownerMonetizationOrderProvider(orderId));
                      },
                child: const Text('Обновить статус'),
              ),
            ],
          );
        },
      ),
    );
  }
}
