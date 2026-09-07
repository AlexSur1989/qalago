import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/constants/dev_seed_accounts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/utils/auth_utils.dart';
import '../providers/auth_provider.dart';

/// One-tap dev login for seed users. Shown only when [AppConstants.devLoginEnabled].
class DevQuickLoginPanel extends ConsumerWidget {
  const DevQuickLoginPanel({super.key, this.compact = false});

  final bool compact;

  Future<void> _login(
    BuildContext context,
    WidgetRef ref,
    DevSeedAccount account,
  ) async {
    try {
      await ref.read(authProvider.notifier).devLogin(account.phone);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(mapAuthError(e))),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!AppConstants.devLoginEnabled) {
      return const SizedBox.shrink();
    }

    final auth = ref.watch(authProvider);
    if (auth.isAuthenticated) {
      return const SizedBox.shrink();
    }

    final chips = devSeedAccounts
        .map(
          (account) => ActionChip(
            label: Text(account.label),
            onPressed: auth.isLoading
                ? null
                : () => _login(context, ref, account),
          ),
        )
        .toList();

    if (compact) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'DEV: быстрый вход без SMS',
              style: TextStyle(
                color: AppTheme.kzBlue.withValues(alpha: 0.85),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: chips),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.kzBlue.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.kzBlue.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'DEV: быстрый вход без SMS',
            style: TextStyle(
              color: AppTheme.kzBlue,
              fontSize: 13,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(spacing: 8, runSpacing: 8, children: chips),
        ],
      ),
    );
  }
}
