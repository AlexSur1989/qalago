import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import 'widgets/service_menu_widgets.dart';

final ownerMenuProvider = FutureProvider.family<Map<String, dynamic>, String>(
  (ref, businessId) async {
    return ref.watch(catalogRepositoryProvider).fetchServiceMenuManage(businessId);
  },
);

class OwnerMenuScreen extends ConsumerWidget {
  const OwnerMenuScreen({super.key, required this.businessId, required this.businessTitle});

  final String businessId;
  final String businessTitle;

  void _invalidateMenu(WidgetRef ref) {
    ref.invalidate(ownerMenuProvider(businessId));
    ref.invalidate(businessDetailsProvider(businessId));
    ref.invalidate(serviceMenuProvider(businessId));
  }

  Future<void> _showGroupDialog(BuildContext context, WidgetRef ref, {Map<String, dynamic>? existing}) async {
    final titleController = TextEditingController(text: existing?['title'] as String? ?? '');

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(existing == null ? 'Новая группа' : 'Редактировать группу'),
        content: TextField(
          controller: titleController,
          decoration: const InputDecoration(
            labelText: 'Название группы *',
            hintText: 'Например: Горячие блюда, Стрижка',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Отмена')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Сохранить')),
        ],
      ),
    );

    if (ok != true || titleController.text.trim().isEmpty) return;

    final repo = ref.read(catalogRepositoryProvider);
    if (existing == null) {
      await repo.createServiceMenuGroup({
        'businessId': businessId,
        'title': titleController.text.trim(),
      });
    } else {
      await repo.updateServiceMenuGroup(existing['id'] as String, {
        'title': titleController.text.trim(),
      });
    }
    _invalidateMenu(ref);
  }

  Future<void> _showItemDialog(
    BuildContext context,
    WidgetRef ref, {
    Map<String, dynamic>? existing,
    String? defaultGroupId,
    required List<Map<String, dynamic>> groups,
  }) async {
    final titleController = TextEditingController(text: existing?['title'] as String? ?? '');
    final descController = TextEditingController(text: existing?['description'] as String? ?? '');
    final priceController = TextEditingController(text: existing?['price']?.toString() ?? '');
    String? selectedGroupId = existing?['groupId'] as String? ?? defaultGroupId;

    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(existing == null ? 'Новая позиция' : 'Редактировать'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (groups.isNotEmpty)
                  DropdownButtonFormField<String?>(
                    value: selectedGroupId,
                    decoration: const InputDecoration(labelText: 'Группа'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Без группы')),
                      ...groups.map(
                        (g) => DropdownMenuItem(
                          value: g['id'] as String,
                          child: Text(g['title'] as String? ?? ''),
                        ),
                      ),
                    ],
                    onChanged: (v) => setState(() => selectedGroupId = v),
                  ),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(labelText: 'Название *'),
                ),
                TextField(
                  controller: priceController,
                  decoration: const InputDecoration(labelText: 'Цена (₸)'),
                  keyboardType: TextInputType.number,
                ),
                TextField(
                  controller: descController,
                  decoration: const InputDecoration(labelText: 'Описание'),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Отмена')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Сохранить')),
          ],
        ),
      ),
    );

    if (ok != true || titleController.text.trim().isEmpty) return;

    final repo = ref.read(catalogRepositoryProvider);
    final price = double.tryParse(priceController.text.trim().replaceAll(',', '.'));
    final payload = <String, dynamic>{
      'title': titleController.text.trim(),
      if (descController.text.trim().isNotEmpty) 'description': descController.text.trim(),
      if (price != null) 'price': price,
      if (selectedGroupId != null) 'groupId': selectedGroupId,
    };

    if (existing == null) {
      await repo.createServiceItem({'businessId': businessId, ...payload});
    } else {
      await repo.updateServiceItem(existing['id'] as String, payload);
    }
    _invalidateMenu(ref);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final menuAsync = ref.watch(ownerMenuProvider(businessId));

    return Scaffold(
      appBar: AppBar(title: Text('Меню · $businessTitle')),
      body: menuAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(ownerMenuProvider(businessId)),
        ),
        data: (menu) {
          final groups = (menu['groups'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>();
          final ungrouped = (menu['ungrouped'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>();
          final groupOptions = groups
              .where((g) => g['isActive'] as bool? ?? true)
              .toList();

          if (groups.isEmpty && ungrouped.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.screen),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.folder_open_outlined, size: 64, color: Colors.grey.shade400),
                    const SizedBox(height: 16),
                    const Text('Меню пустое', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    const Text(
                      'Сначала создайте группу (например «Стрижка»),\nзатем добавьте позиции внутри неё',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.black54),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.screen),
            children: [
              ...groups.map((group) => _OwnerGroupCard(
                    group: group,
                    onEditGroup: () => _showGroupDialog(context, ref, existing: group),
                    onAddItem: () => _showItemDialog(
                      context,
                      ref,
                      defaultGroupId: group['id'] as String,
                      groups: groupOptions,
                    ),
                    onItemAction: (item, action) => _handleItemAction(
                      context,
                      ref,
                      item,
                      action,
                      groupOptions,
                    ),
                  )),
              if (ungrouped.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('Без группы', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                ...ungrouped.map(
                  (item) => _OwnerItemTile(
                    item: item,
                    onAction: (action) => _handleItemAction(context, ref, item, action, groupOptions),
                  ),
                ),
              ],
            ],
          );
        },
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            heroTag: 'add_group',
            onPressed: () => _showGroupDialog(context, ref),
            icon: const Icon(Icons.create_new_folder_outlined),
            label: const Text('Группа'),
          ),
          const SizedBox(height: 12),
          FloatingActionButton.extended(
            heroTag: 'add_item',
            onPressed: () {
              final menu = menuAsync.valueOrNull;
              final groups = (menu?['groups'] as List<dynamic>? ?? [])
                  .cast<Map<String, dynamic>>();
              final firstGroupId = groups.isNotEmpty ? groups.first['id'] as String? : null;
              _showItemDialog(
                context,
                ref,
                defaultGroupId: firstGroupId,
                groups: groups.where((g) => g['isActive'] as bool? ?? true).toList(),
              );
            },
            icon: const Icon(Icons.add),
            label: const Text('Позиция'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleItemAction(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> item,
    String action,
    List<Map<String, dynamic>> groups,
  ) async {
    final repo = ref.read(catalogRepositoryProvider);
    final id = item['id'] as String;
    if (action == 'edit') {
      await _showItemDialog(context, ref, existing: item, groups: groups);
    } else if (action == 'hide') {
      await repo.updateServiceItem(id, {'isActive': false});
      _invalidateMenu(ref);
    } else if (action == 'show') {
      await repo.updateServiceItem(id, {'isActive': true});
      _invalidateMenu(ref);
    } else if (action == 'delete') {
      await repo.deleteServiceItem(id);
      _invalidateMenu(ref);
    }
  }
}

class _OwnerGroupCard extends StatelessWidget {
  const _OwnerGroupCard({
    required this.group,
    required this.onEditGroup,
    required this.onAddItem,
    required this.onItemAction,
  });

  final Map<String, dynamic> group;
  final VoidCallback onEditGroup;
  final VoidCallback onAddItem;
  final void Function(Map<String, dynamic> item, String action) onItemAction;

  @override
  Widget build(BuildContext context) {
    final isActive = group['isActive'] as bool? ?? true;
    final items = (group['items'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.item),
      child: ExpansionTile(
        initiallyExpanded: true,
        title: Text(
          group['title'] as String? ?? '',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            decoration: isActive ? null : TextDecoration.lineThrough,
            color: isActive ? AppTheme.kzBlue : Colors.grey,
          ),
        ),
        subtitle: Text('${items.length} поз.'),
        trailing: PopupMenuButton<String>(
          onSelected: (action) async {
            if (action == 'edit') {
              onEditGroup();
            } else if (action == 'add') {
              onAddItem();
            }
          },
          itemBuilder: (_) => const [
            PopupMenuItem(value: 'edit', child: Text('Переименовать')),
            PopupMenuItem(value: 'add', child: Text('Добавить позицию')),
          ],
        ),
        children: [
          if (items.isEmpty)
            const Padding(
              padding: EdgeInsets.all(12),
              child: Text('Нет позиций в этой группе', style: TextStyle(color: Colors.black54)),
            )
          else
            ...items.map(
              (item) => _OwnerItemTile(
                item: item,
                onAction: (action) => onItemAction(item, action),
              ),
            ),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: onAddItem,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Позиция в группу'),
            ),
          ),
        ],
      ),
    );
  }
}

class _OwnerItemTile extends StatelessWidget {
  const _OwnerItemTile({required this.item, required this.onAction});

  final Map<String, dynamic> item;
  final void Function(String action) onAction;

  @override
  Widget build(BuildContext context) {
    final price = item['price'];
    final isActive = item['isActive'] as bool? ?? true;

    return ListTile(
      dense: true,
      title: Text(
        item['title'] as String? ?? '',
        style: TextStyle(
          fontWeight: FontWeight.w600,
          decoration: isActive ? null : TextDecoration.lineThrough,
          color: isActive ? null : Colors.grey,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (item['description'] != null) Text(item['description'] as String),
          if (price != null)
            Text(
              '${formatMenuPrice(price)} ₸',
              style: const TextStyle(color: AppTheme.kzBlue, fontWeight: FontWeight.bold),
            ),
        ],
      ),
      trailing: PopupMenuButton<String>(
        onSelected: onAction,
        itemBuilder: (_) => [
          const PopupMenuItem(value: 'edit', child: Text('Редактировать')),
          PopupMenuItem(
            value: isActive ? 'hide' : 'show',
            child: Text(isActive ? 'Скрыть' : 'Показать'),
          ),
          const PopupMenuItem(value: 'delete', child: Text('Удалить')),
        ],
      ),
    );
  }
}
