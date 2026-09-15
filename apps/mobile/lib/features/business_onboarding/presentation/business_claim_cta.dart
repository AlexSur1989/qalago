import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth/auth_prompt.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/onboarding_providers.dart';
import '../utils/onboarding_labels.dart';

class BusinessClaimCta extends ConsumerWidget {
  const BusinessClaimCta({super.key, required this.businessId});

  final String businessId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final isAuthenticated = ref.watch(authProvider).isAuthenticated;
    if (!isAuthenticated) {
      return OutlinedButton(
        onPressed: () => showAuthRequiredDialog(
          context,
          title: l10n.claimCtaLoginTitle,
          message: l10n.claimCtaLoginMessage,
          returnPath: '/business/$businessId/claim',
        ),
        child: Text(l10n.claimCtaYourBusiness),
      );
    }

    final ownsBusiness = ref.watch(myBusinessesProvider).maybeWhen(
          data: (businesses) => businesses.any((b) => b['id'] == businessId),
          orElse: () => false,
        );
    if (ownsBusiness) return const SizedBox.shrink();

    final claimAsync = ref.watch(claimForBusinessProvider(businessId));
    return claimAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (claim) {
        if (claim == null) {
          return OutlinedButton(
            onPressed: () => context.push('/business/$businessId/claim'),
            child: Text(l10n.claimCtaYourBusiness),
          );
        }
        final status = claim['status'] as String? ?? '';
        if (status == 'PENDING') {
          return Text(l10n.claimCtaPending);
        }
        if (status == 'REJECTED' || status == 'CANCELLED') {
          return OutlinedButton(
            onPressed: () => context.push('/business/$businessId/claim'),
            child: Text(l10n.claimCtaConfirmOwner),
          );
        }
        return Text(claimStatusLabel(l10n, status));
      },
    );
  }
}
