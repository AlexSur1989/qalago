import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/locale/l10n_extension.dart';
import '../../features/auth/providers/auth_provider.dart';

class EmptyCityView extends ConsumerWidget {
  const EmptyCityView({
    super.key,
    required this.cityName,
    required this.onPickCity,
    this.compact = false,
    this.isComingSoon = false,
  });

  final String cityName;
  final VoidCallback onPickCity;
  final bool compact;
  final bool isComingSoon;

  void _openAddBusiness(BuildContext context, WidgetRef ref) {
    final auth = ref.read(authProvider);
    if (auth.isAuthenticated) {
      context.push('/owner/create-business');
      return;
    }
    context.push('/login');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final padding = compact ? 20.0 : 28.0;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(padding),
      decoration: BoxDecoration(
        color: AppTheme.kzBlue.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(compact ? 20 : 24),
        border: Border.all(color: AppTheme.kzBlue.withValues(alpha: 0.12)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: compact ? 56 : 72,
            height: compact ? 56 : 72,
            decoration: BoxDecoration(
              color: context.cs.surface,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.kzBlue.withValues(alpha: 0.12),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Icon(
              Icons.location_city_outlined,
              size: compact ? 30 : 36,
              color: AppTheme.kzBlue,
            ),
          ),
          SizedBox(height: compact ? 14 : 18),
          Text(
            isComingSoon
                ? l10n.emptyCityComingTitle(cityName)
                : l10n.emptyCitySoonTitle(cityName),
            textAlign: TextAlign.center,
            style: context.tt.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
              height: 1.25,
            ),
          ),
          SizedBox(height: compact ? 8 : 10),
          Text(
            isComingSoon ? l10n.emptyCityComingBody : l10n.emptyCityEmptyBody,
            textAlign: TextAlign.center,
            style: context.bodySecondaryStyle.copyWith(height: 1.45),
          ),
          SizedBox(height: compact ? 18 : 22),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onPickCity,
              child: Text(l10n.emptyCityPickOther),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => _openAddBusiness(context, ref),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.kzBlue,
                side: const BorderSide(color: AppTheme.kzBlue),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(l10n.emptyCityAddBusiness),
            ),
          ),
        ],
      ),
    );
  }
}
