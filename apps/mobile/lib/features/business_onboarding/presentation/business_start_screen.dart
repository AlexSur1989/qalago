import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/rbac/business_access.dart';
import '../../../core/theme/app_spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../utils/onboarding_labels.dart';
import '../../../core/theme/app_theme.dart';

class BusinessStartScreen extends ConsumerWidget {
  const BusinessStartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final entriesAsync = ref.watch(myBusinessEntriesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.onboardingForBusinessTitle)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          Text(
            l10n.onboardingIntro,
            style: const TextStyle(color: AppTheme.textMuted, height: 1.4),
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
                  Text(
                    l10n.profileMyBusinesses,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  ...entries.map(
                    (entry) => Card(
                      child: ListTile(
                        title: Text(entry.business['title'] as String? ?? ''),
                        subtitle: Text(
                          membershipRoleLabel(l10n, entry.access.role.apiValue),
                        ),
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
            child: Text(l10n.profileFindExistingBusiness),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => context.push('/business/apply'),
            child: Text(l10n.onboardingAddNew),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => context.push('/business/applications'),
            child: Text(l10n.onboardingApplicationsTitle),
          ),
        ],
      ),
    );
  }
}
