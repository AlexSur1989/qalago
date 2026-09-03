import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';

final ownerPromotionsProvider =
    FutureProvider.family<List<PromotionModel>, String>((ref, businessId) async {
  return ref.watch(catalogRepositoryProvider).fetchBusinessPromotions(businessId);
});

class OwnerPromotionsScreen extends ConsumerWidget {
  const OwnerPromotionsScreen({
    super.key,
    required this.businessId,
    required this.businessTitle,
  });

  final String businessId;
  final String businessTitle;

  void _invalidate(WidgetRef ref) {
    ref.invalidate(ownerPromotionsProvider(businessId));
    ref.invalidate(promotionsProvider);
  }

  Future<void> _showPromotionDialog(
    BuildContext context,
    WidgetRef ref, {
    PromotionModel? existing,
  }) async {
    final titleController = TextEditingController(text: existing?.title ?? '');
    final discountController =
        TextEditingController(text: existing?.discountText ?? '-20%');
    final descController =
        TextEditingController(text: existing?.description ?? '');
    var status = existing?.status ?? 'ACTIVE';

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(existing == null ? 'Новая акция' : 'Редактировать акцию'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(labelText: 'Название'),
                ),
                TextField(
                  controller: discountController,
                  decoration: const InputDecoration(labelText: 'Скидка'),
                ),
                TextField(
                  controller: descController,
                  decoration: const InputDecoration(labelText: 'Описание'),
                  minLines: 2,
                  maxLines: 4,
                ),
                const SizedBox(height: 8),
                InputDecorator(
                  decoration: const InputDecoration(labelText: 'Статус'),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: status,
                      items: const [
                        DropdownMenuItem(value: 'ACTIVE', child: Text('Активна')),
                        DropdownMenuItem(value: 'DRAFT', child: Text('Черновик')),
                        DropdownMenuItem(
                          value: 'EXPIRED',
                          child: Text('Завершена'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value != null) setState(() => status = value);
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Отмена'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(existing == null ? 'Создать' : 'Сохранить'),
            ),
          ],
        ),
      ),
    );

    if (saved != true || titleController.text.trim().isEmpty) return;

    final repo = ref.read(catalogRepositoryProvider);
    final payload = {
      'title': titleController.text.trim(),
      'discountText': discountController.text.trim(),
      'description': descController.text.trim(),
      'status': status,
    };

    try {
      if (existing == null) {
        await repo.createPromotion({'businessId': businessId, ...payload});
      } else {
        await repo.updatePromotion(existing.id, payload);
      }
      _invalidate(ref);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(existing == null ? 'Акция создана' : 'Акция обновлена'),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка: $e')),
        );
      }
    }
  }

  Future<void> _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    PromotionModel promo,
  ) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Удалить акцию?'),
        content: Text('«${promo.title}» будет удалена без восстановления.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Удалить'),
          ),
        ],
      ),
    );
    if (ok != true) return;

    try {
      await ref.read(catalogRepositoryProvider).deletePromotion(promo.id);
      _invalidate(ref);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Акция удалена')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка: $e')),
        );
      }
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'ACTIVE':
        return 'Активна';
      case 'DRAFT':
        return 'Черновик';
      case 'EXPIRED':
        return 'Завершена';
      default:
        return status ?? '—';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final promotionsAsync = ref.watch(ownerPromotionsProvider(businessId));

    return Scaffold(
      appBar: AppBar(title: Text('Акции · $businessTitle')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showPromotionDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Новая акция'),
      ),
      body: promotionsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(ownerPromotionsProvider(businessId)),
        ),
        data: (promotions) {
          if (promotions.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.screen),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.local_offer_outlined,
                      size: 64,
                      color: AppTheme.kzBlue.withValues(alpha: 0.35),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Пока нет акций',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Создайте первую акцию для привлечения гостей',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.black.withValues(alpha: 0.55),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.screen,
              AppSpacing.screen,
              AppSpacing.screen,
              96,
            ),
            itemCount: promotions.length,
            separatorBuilder: (_, _) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final promo = promotions[index];
              final isActive = promo.status == 'ACTIVE';
              return Material(
                color: Colors.white,
                elevation: 1,
                shadowColor: Colors.black.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
                child: ListTile(
                  contentPadding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
                  title: Text(
                    promo.title,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (promo.discountText != null &&
                          promo.discountText!.isNotEmpty)
                        Text(
                          promo.discountText!,
                          style: const TextStyle(
                            color: AppTheme.kzBlue,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      if (promo.description != null &&
                          promo.description!.isNotEmpty)
                        Text(promo.description!),
                      const SizedBox(height: 4),
                      Text(
                        _statusLabel(promo.status),
                        style: TextStyle(
                          color: isActive ? Colors.green.shade700 : Colors.black54,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  trailing: PopupMenuButton<String>(
                    onSelected: (value) {
                      if (value == 'edit') {
                        _showPromotionDialog(context, ref, existing: promo);
                      } else if (value == 'delete') {
                        _confirmDelete(context, ref, promo);
                      }
                    },
                    itemBuilder: (context) => const [
                      PopupMenuItem(value: 'edit', child: Text('Редактировать')),
                      PopupMenuItem(value: 'delete', child: Text('Удалить')),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
