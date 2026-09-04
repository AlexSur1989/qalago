import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_utils.dart';
import '../providers/owner_providers.dart';
import 'widgets/owner_scaffold.dart';
import 'widgets/owner_views_chart.dart';

const _kpiConfig = [
  ('VIEW_BUSINESS', 'Просмотры'),
  ('CALL_CLICK', 'Звонки'),
  ('WHATSAPP_CLICK', 'WhatsApp'),
  ('ROUTE_CLICK', 'Маршруты'),
  ('FAVORITE_ADD', 'Избранное'),
];

class OwnerDashboardScreen extends ConsumerWidget {
  const OwnerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final businessesAsync = ref.watch(myBusinessesProvider);
    final selected = ref.watch(ownerSelectedBusinessProvider);

    return OwnerScaffold(
      title: 'Кабинет бизнеса',
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/owner/create-business'),
        label: const Text('Добавить'),
        icon: const Icon(Icons.add_business),
      ),
      body: businessesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(myBusinessesProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return _EmptyOwnerState(
              onRegister: () => context.push('/owner/create-business'),
            );
          }

          final business = selected ?? items.first;
          final businessId = business['id'] as String;
          final model = BusinessModel.fromJson(business);
          final encodedTitle = Uri.encodeComponent(model.title);
          final dashboardAsync = ref.watch(ownerDashboardProvider(businessId));

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(ownerDashboardProvider(businessId));
              ref.invalidate(myBusinessesProvider);
            },
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.screen),
              children: [
                if (items.length > 1) ...[
                  DropdownButtonFormField<String>(
                    value: businessId,
                    decoration: const InputDecoration(labelText: 'Заведение'),
                    items: items
                        .map(
                          (b) => DropdownMenuItem(
                            value: b['id'] as String,
                            child: Text(b['title'] as String? ?? ''),
                          ),
                        )
                        .toList(),
                    onChanged: (id) {
                      if (id != null) {
                        ref.read(selectedOwnerBusinessIdProvider.notifier).select(id);
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                ],
                Text(
                  'Добро пожаловать, ${model.title}!',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${ownerStatusLabel(business['status'] as String? ?? '')} · ${model.address}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey.shade700,
                      ),
                ),
                const SizedBox(height: 16),
                dashboardAsync.when(
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (e, _) => ErrorView(
                    message: '$e',
                    onRetry: () => ref.invalidate(ownerDashboardProvider(businessId)),
                  ),
                  data: (data) => _DashboardContent(
                    business: business,
                    businessId: businessId,
                    encodedTitle: encodedTitle,
                    data: data,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _EmptyOwnerState extends StatelessWidget {
  const _EmptyOwnerState({required this.onRegister});

  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.screen),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.storefront_outlined, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            const Text(
              'Нет заведений',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            const Text(
              'Зарегистрируйте заведение — после модерации оно появится в QalaGo.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onRegister,
              icon: const Icon(Icons.add_business),
              label: const Text('Зарегистрировать заведение'),
            ),
          ],
        ),
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({
    required this.business,
    required this.businessId,
    required this.encodedTitle,
    required this.data,
  });

  final Map<String, dynamic> business;
  final String businessId;
  final String encodedTitle;
  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final summary7 = data['summary7'] as Map<String, dynamic>;
    final prevByType = data['prevByType'] as Map<String, int>;
    final byType7 = ownerByType(summary7);
    final trendsRaw = data['trends'] as Map<String, dynamic>;
    final trendItems = aggregateViewTrends(trendsRaw['items'] as List<dynamic>? ?? []);
    final activePromotions = data['activePromotions'] as List<Map<String, dynamic>>;
    final plan = data['plan'] as Map<String, dynamic>;
    final catalog = plan['catalog'] as Map<String, dynamic>? ?? {};
    final completion = ownerProfileCompletion(business);
    final totalActions = (summary7['total'] as num?)?.toInt() ?? 0;
    final views = byType7['VIEW_BUSINESS'] ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          '$views просмотров · $totalActions действий за 7 дней',
          style: TextStyle(color: Colors.grey.shade700),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 110,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _kpiConfig.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, i) {
              final (key, label) = _kpiConfig[i];
              final current = byType7[key] ?? 0;
              final previous = prevByType[key] ?? 0;
              final delta = ownerFormatDelta(current, previous);
              return SizedBox(
                width: 132,
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(label, style: Theme.of(context).textTheme.labelSmall),
                        const Spacer(),
                        Text(
                          ownerFormatNumber(current),
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        if (delta != null)
                          Text(
                            '$delta за нед.',
                            style: TextStyle(
                              fontSize: 11,
                              color: current > previous
                                  ? Colors.green.shade700
                                  : Colors.grey.shade600,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Просмотры за 7 дней',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                OwnerViewsChart(items: trendItems),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _SideCard(
                title: 'Профиль',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('$completion% заполнено'),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(value: completion / 100),
                    const SizedBox(height: 10),
                    OutlinedButton(
                      onPressed: () => context.push(
                        '/owner/edit/$businessId?title=$encodedTitle',
                      ),
                      child: const Text('Заполнить'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _SideCard(
                title: 'Тариф',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      catalog['nameRu'] as String? ?? 'Базовый',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: () => context.push('/owner/plan'),
                      child: const Text('Улучшить'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Активные акции',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextButton(
                      onPressed: () => context.push(
                        '/owner/promotions/$businessId?title=$encodedTitle',
                      ),
                      child: const Text('Все'),
                    ),
                  ],
                ),
                if (activePromotions.isEmpty)
                  Text('Нет активных акций', style: TextStyle(color: Colors.grey.shade600))
                else
                  ...activePromotions.take(3).map(
                        (p) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(p['title'] as String? ?? ''),
                          subtitle: Text(p['discountText'] as String? ?? ''),
                        ),
                      ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Управление',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
        ),
        const SizedBox(height: 10),
        _ManagementGrid(businessId: businessId, encodedTitle: encodedTitle),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: () => context.push('/business/$businessId'),
          icon: const Icon(Icons.visibility_outlined),
          label: const Text('Предпросмотр карточки'),
        ),
      ],
    );
  }
}

class _SideCard extends StatelessWidget {
  const _SideCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            child,
          ],
        ),
      ),
    );
  }
}

class _ManagementGrid extends StatelessWidget {
  const _ManagementGrid({
    required this.businessId,
    required this.encodedTitle,
  });

  final String businessId;
  final String encodedTitle;

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.storefront_outlined, 'Профиль', '/owner/edit/$businessId?title=$encodedTitle'),
      (Icons.restaurant_menu, 'Меню', '/owner/menu/$businessId?title=$encodedTitle'),
      (Icons.photo_library_outlined, 'Галерея', '/owner/gallery/$businessId?title=$encodedTitle'),
      (Icons.local_offer_outlined, 'Акции', '/owner/promotions/$businessId?title=$encodedTitle'),
      (Icons.star_outline, 'Отзывы', '/owner/reviews/$businessId?title=$encodedTitle'),
      (Icons.bar_chart_outlined, 'Статистика', '/owner/analytics/$businessId?title=$encodedTitle'),
    ];

    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 1.05,
      children: items
          .map(
            (item) => OutlinedButton(
              onPressed: () => context.push(item.$3),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.all(8),
                alignment: Alignment.center,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(item.$1, color: AppTheme.kzBlue),
                  const SizedBox(height: 6),
                  Text(
                    item.$2,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}
