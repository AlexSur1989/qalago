import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/rbac/business_access.dart';
import '../../../core/theme/app_spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../utils/onboarding_labels.dart';

class BusinessStartScreen extends ConsumerWidget {
  const BusinessStartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entriesAsync = ref.watch(myBusinessEntriesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Для бизнеса')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          const Text(
            'Добавьте или найдите свой бизнес. Если он уже есть в QalaGo, запросите доступ вместо создания новой карточки.',
            style: TextStyle(color: Colors.black54, height: 1.4),
          ),
          const SizedBox(height: 24),
          entriesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => const SizedBox.shrink(),
            data: (entries) {
              if (entries.isEmpty) return const SizedBox.shrink();
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Мои бизнесы',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  ...entries.map(
                    (entry) => Card(
                      child: ListTile(
                        title: Text(entry.business['title'] as String? ?? ''),
                        subtitle: Text(membershipRoleLabel(entry.access.role.apiValue)),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.push('/owner'),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              );
            },
          ),
          FilledButton(
            onPressed: () => context.push('/business/search'),
            child: const Text('Найти существующий бизнес'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => context.push('/business/apply'),
            child: const Text('Добавить новый бизнес'),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.push('/business/applications'),
            child: const Text('Мои заявки'),
          ),
        ],
      ),
    );
  }
}
