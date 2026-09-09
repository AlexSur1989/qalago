import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../providers/onboarding_providers.dart';
import '../utils/onboarding_labels.dart';

class BusinessApplicationsScreen extends ConsumerWidget {
  const BusinessApplicationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appsAsync = ref.watch(myApplicationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Мои заявки')),
      body: appsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Заявок пока нет'),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => context.push('/business/apply'),
                    child: const Text('Добавить бизнес'),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myApplicationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.screen),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = items[index];
                final status = item['status'] as String? ?? '';
                final title = item['title'] as String? ?? '';
                final reason = item['rejectionReason'] as String?;
                return Card(
                  child: ListTile(
                    title: Text(title),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(applicationStatusLabel(status)),
                        if (reason != null && reason.isNotEmpty) Text('Причина: $reason'),
                      ],
                    ),
                    trailing: (status == 'DRAFT' || status == 'REJECTED')
                        ? const Icon(Icons.chevron_right)
                        : null,
                    onTap: (status == 'DRAFT' || status == 'REJECTED')
                        ? () => context.push('/business/apply?id=${item['id']}')
                        : status == 'APPROVED'
                            ? () => context.go('/owner')
                            : null,
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
