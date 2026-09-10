import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/constants/dev_seed_accounts.dart';
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

    final buttons = devSeedAccounts
        .map(
          (account) => DevQuickLoginAccountButton(
            label: account.label,
            onPressed: auth.isLoading
                ? null
                : () => _login(context, ref, account),
          ),
        )
        .toList();

    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'DEV: быстрый вход без SMS',
          style: _panelTitleStyle(context),
        ),
        SizedBox(height: compact ? 8 : 10),
        Wrap(spacing: 8, runSpacing: 8, children: buttons),
      ],
    );

    if (compact) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: content,
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: _panelDecoration(context),
      child: content,
    );
  }
}

/// Theme-based DEV account control — same visual style for every seed role.
@visibleForTesting
class DevQuickLoginAccountButton extends StatelessWidget {
  const DevQuickLoginAccountButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback? onPressed;

  static ButtonStyle buttonStyle(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return FilledButton.styleFrom(
      backgroundColor: scheme.primary,
      foregroundColor: scheme.onPrimary,
      disabledBackgroundColor: scheme.primary.withValues(alpha: 0.38),
      disabledForegroundColor: scheme.onPrimary.withValues(alpha: 0.62),
      minimumSize: const Size(148, 44),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      textStyle: theme.textTheme.labelLarge?.copyWith(
        fontWeight: FontWeight.w600,
        color: scheme.onPrimary,
      ),
    ).merge(theme.filledButtonTheme.style);
  }

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: onPressed,
      style: buttonStyle(context),
      child: Text(label, textAlign: TextAlign.center),
    );
  }
}

TextStyle _panelTitleStyle(BuildContext context) {
  final theme = Theme.of(context);
  return theme.textTheme.titleSmall!.copyWith(
    color: theme.colorScheme.onSurfaceVariant,
    fontWeight: FontWeight.w700,
  );
}

BoxDecoration _panelDecoration(BuildContext context) {
  final theme = Theme.of(context);
  final scheme = theme.colorScheme;
  final cardShape = theme.cardTheme.shape;
  final radius = cardShape is RoundedRectangleBorder
      ? cardShape.borderRadius
      : BorderRadius.circular(20);

  return BoxDecoration(
    color: scheme.surface,
    borderRadius: radius,
    border: Border.all(
      color: scheme.outlineVariant.withValues(alpha: 0.55),
    ),
  );
}
