import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

class OwnerAnalyticsScreen extends ConsumerStatefulWidget {
  const OwnerAnalyticsScreen({
    super.key,
    required this.businessId,
    required this.businessTitle,
  });

  final String businessId;
  final String businessTitle;

  @override
  ConsumerState<OwnerAnalyticsScreen> createState() => _OwnerAnalyticsScreenState();
}

class _OwnerAnalyticsScreenState extends ConsumerState<OwnerAnalyticsScreen> {
  int _days = 30;

  @override
  Widget build(BuildContext context) {
    final query = (businessId: widget.businessId, days: _days);
    final analyticsAsync = ref.watch(businessAnalyticsProvider(query));

    return Scaffold(
      appBar: AppBar(title: Text('Статистика · ${widget.businessTitle}')),
      body: analyticsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(businessAnalyticsProvider(query)),
        ),
        data: (data) {
          final total = data['total'] as int? ?? 0;
          final byType = (data['byType'] as Map<String, dynamic>?) ?? {};

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.screen),
            children: [
              SegmentedButton<int>(
                segments: const [
                  ButtonSegment(value: 7, label: Text('7 дн')),
                  ButtonSegment(value: 30, label: Text('30 дн')),
                  ButtonSegment(value: 90, label: Text('90 дн')),
                ],
                selected: {_days},
                onSelectionChanged: (value) {
                  setState(() => _days = value.first);
                },
              ),
              const SizedBox(height: 20),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$total',
                        style: Theme.of(context).textTheme.displaySmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppTheme.kzBlue,
                            ),
                      ),
                      Text('всего действий за $_days дн.'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Детализация', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              _StatTile(
                icon: Icons.visibility_outlined,
                label: 'Просмотры карточки',
                value: _count(byType, 'VIEW_BUSINESS'),
              ),
              _StatTile(
                icon: Icons.phone_outlined,
                label: 'Нажатия «Позвонить»',
                value: _count(byType, 'CALL_CLICK'),
              ),
              _StatTile(
                icon: Icons.chat_outlined,
                label: 'WhatsApp',
                value: _count(byType, 'WHATSAPP_CLICK'),
              ),
              _StatTile(
                icon: Icons.route_outlined,
                label: 'Маршрут',
                value: _count(byType, 'ROUTE_CLICK'),
              ),
              _StatTile(
                icon: Icons.favorite_outline,
                label: 'Добавили в избранное',
                value: _count(byType, 'FAVORITE_ADD'),
              ),
              _StatTile(
                icon: Icons.local_offer_outlined,
                label: 'Просмотры акций',
                value: _count(byType, 'PROMOTION_VIEW'),
              ),
              if (total == 0) ...[
                const SizedBox(height: 24),
                Text(
                  'Пока нет данных. Откройте карточку заведения как гость — просмотры появятся здесь.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  int _count(Map<String, dynamic> byType, String key) {
    final value = byType[key];
    if (value is int) return value;
    if (value is num) return value.toInt();
    return 0;
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.12),
          child: Icon(icon, color: AppTheme.kzBlue, size: 20),
        ),
        title: Text(label),
        trailing: Text(
          '$value',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
    );
  }
}
