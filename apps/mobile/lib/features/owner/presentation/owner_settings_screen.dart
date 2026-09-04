import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/owner_providers.dart';
import 'widgets/owner_scaffold.dart';

class OwnerSettingsScreen extends ConsumerStatefulWidget {
  const OwnerSettingsScreen({super.key});

  @override
  ConsumerState<OwnerSettingsScreen> createState() => _OwnerSettingsScreenState();
}

class _OwnerSettingsScreenState extends ConsumerState<OwnerSettingsScreen> {
  final _nameController = TextEditingController();
  bool _saving = false;
  bool _initialized = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final business = ref.watch(ownerSelectedBusinessProvider);
    final user = auth.user;

    if (!_initialized && (user?.name?.isNotEmpty ?? false)) {
      _nameController.text = user!.name!;
      _initialized = true;
    }

    return OwnerScaffold(
      title: 'Настройки',
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Аккаунт', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  TextField(
                    readOnly: true,
                    decoration: InputDecoration(
                      labelText: 'Телефон',
                    ),
                    controller: TextEditingController(text: user?.phone ?? ''),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Имя владельца',
                      hintText: 'Как отображать в кабинете',
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _saving
                        ? null
                        : () async {
                            setState(() => _saving = true);
                            try {
                              await ref
                                  .read(authProvider.notifier)
                                  .updateName(_nameController.text.trim());
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Имя сохранено')),
                                );
                              }
                            } catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Ошибка: $e')),
                                );
                              }
                            } finally {
                              if (mounted) setState(() => _saving = false);
                            }
                          },
                    child: Text(_saving ? 'Сохранение…' : 'Сохранить'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Заведение', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  if (business != null) ...[
                    Text(
                      'Редактируйте карточку, часы и контакты в профиле.',
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        FilledButton(
                          onPressed: () {
                            final id = business['id'] as String;
                            final title = Uri.encodeComponent(
                              business['title'] as String? ?? '',
                            );
                            context.push('/owner/edit/$id?title=$title');
                          },
                          child: const Text('Профиль'),
                        ),
                        OutlinedButton(
                          onPressed: () {
                            final id = business['id'] as String;
                            final title = Uri.encodeComponent(
                              business['title'] as String? ?? '',
                            );
                            context.push('/owner/gallery/$id?title=$title');
                          },
                          child: const Text('Галерея'),
                        ),
                      ],
                    ),
                  ] else ...[
                    Text(
                      'Нет заведения — подайте заявку на модерацию.',
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () => context.push('/owner/create-business'),
                      child: const Text('Зарегистрировать'),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Безопасность', style: TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text(
                    'Вход по SMS-коду. Для смены номера обратитесь в поддержку.',
                    style: TextStyle(color: Colors.grey.shade700),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
