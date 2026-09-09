import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_spacing.dart';
import '../providers/onboarding_providers.dart';
import '../utils/onboarding_labels.dart';
import '../utils/onboarding_errors.dart';

class BusinessClaimsScreen extends ConsumerWidget {
  const BusinessClaimsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final claimsAsync = ref.watch(myClaimsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Подтверждение прав')),
      body: claimsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text(mapOnboardingError(e))),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Заявок на подтверждение пока нет'),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => context.push('/business/search'),
                    child: const Text('Найти свой бизнес'),
                  ),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myClaimsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.screen),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = items[index];
                final business = item['business'] as Map<String, dynamic>?;
                final status = item['status'] as String? ?? '';
                final reason = item['rejectionReason'] as String?;
                return Card(
                  child: ListTile(
                    title: Text(business?['title'] as String? ?? 'Бизнес'),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(claimStatusLabel(status)),
                        if (reason != null && reason.isNotEmpty) Text('Причина: $reason'),
                      ],
                    ),
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
