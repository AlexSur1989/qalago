import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';

import '../../../core/locale/app_locale_provider.dart';
import '../../../core/rbac/business_access.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_business_location.dart';
import '../owner_location_errors.dart';
import '../providers/owner_locations_provider.dart';
import '../providers/owner_providers.dart';
import '../../../shared/models/business_branch_location.dart';

class OwnerLocationsScreen extends ConsumerWidget {
  const OwnerLocationsScreen({
    super.key,
    required this.businessId,
    required this.businessTitle,
  });

  final String businessId;
  final String businessTitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final access = ref.watch(selectedBusinessAccessProvider);
    final canManage = access != null &&
        hasPermission(access, BusinessPermission.businessProfileEdit);
    final locationsAsync = ref.watch(ownerBusinessLocationsProvider(businessId));
    final encodedTitle = Uri.encodeComponent(businessTitle);

    return Scaffold(
      appBar: AppBar(
        leading: qalagoBackLeading(context, fallbackLocation: '/owner'),
        title: Text(context.l10n.ownerLocationsTitle),
      ),
      floatingActionButton: canManage
          ? FloatingActionButton.extended(
              onPressed: () => context.push(
                '/owner/locations/$businessId/new?title=$encodedTitle',
              ),
              icon: const Icon(Icons.add),
              label: Text(context.l10n.ownerLocationAdd),
            )
          : null,
      body: locationsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: mapOwnerLocationError(context.l10n, e),
          onRetry: () => ref.invalidate(ownerBusinessLocationsProvider(businessId)),
        ),
        data: (locations) {
          if (locations.isEmpty) {
            return _EmptyLocationsBody(
              businessId: businessId,
              canManage: canManage,
              encodedTitle: encodedTitle,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(AppSpacing.screen),
            itemCount: locations.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final loc = locations[index];
              return _LocationCard(
                location: loc,
                canManage: canManage,
                businessId: businessId,
                encodedTitle: encodedTitle,
                onSetPrimary: canManage && !loc.isPrimary
                    ? () => _setPrimary(context, ref, loc)
                    : null,
                onDelete: canManage && !loc.isPrimary
                    ? () => _confirmDelete(context, ref, loc)
                    : null,
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _setPrimary(
    BuildContext context,
    WidgetRef ref,
    BusinessBranchLocation loc,
  ) async {
    final l10n = context.l10n;
    final locale = ref.read(appLocaleProvider).languageCode;
    final cityName = loc.displayCityName(localeCode: locale);
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.ownerLocationSetPrimaryConfirmTitle),
        content: Text('$cityName, ${loc.address}'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.commonCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.ownerLocationSetPrimary),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await ref.read(catalogRepositoryProvider).setPrimaryOwnerBusinessLocation(
            businessId,
            loc.id,
          );
      ref.invalidate(ownerBusinessLocationsProvider(businessId));
      ref.invalidate(myBusinessEntriesProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.ownerLocationPrimaryUpdated)),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapOwnerLocationError(l10n, e))),
        );
      }
    }
  }

  Future<void> _confirmDelete(
    BuildContext context,
    WidgetRef ref,
    BusinessBranchLocation loc,
  ) async {
    final l10n = context.l10n;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.ownerLocationDeleteConfirmTitle),
        content: Text(loc.address),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.commonCancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l10n.ownerLocationDelete),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await ref.read(catalogRepositoryProvider).deleteOwnerBusinessLocation(
            businessId,
            loc.id,
          );
      ref.invalidate(ownerBusinessLocationsProvider(businessId));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.ownerLocationDeleted)),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapOwnerLocationError(l10n, e))),
        );
      }
    }
  }
}

class _EmptyLocationsBody extends ConsumerWidget {
  const _EmptyLocationsBody({
    required this.businessId,
    required this.canManage,
    required this.encodedTitle,
  });

  final String businessId;
  final bool canManage;
  final String encodedTitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    return FutureBuilder<Map<String, dynamic>>(
      future: ref.read(catalogRepositoryProvider).fetchBusinessDetails(businessId),
      builder: (context, snapshot) {
        final legacyAddress = snapshot.data?['address'] as String?;
        return Padding(
          padding: const EdgeInsets.all(AppSpacing.screen),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                l10n.ownerLocationsEmptyTitle,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(l10n.ownerLocationsEmptyBody),
              if (legacyAddress != null && legacyAddress.trim().isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  l10n.ownerLocationsLegacyHint,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const SizedBox(height: 4),
                Text(
                  legacyAddress,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ],
              const SizedBox(height: 24),
              if (canManage)
                FilledButton.icon(
                  onPressed: () => context.push(
                    '/owner/locations/$businessId/new?title=$encodedTitle',
                  ),
                  icon: const Icon(Icons.add),
                  label: Text(l10n.ownerLocationAdd),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _LocationCard extends StatelessWidget {
  const _LocationCard({
    required this.location,
    required this.canManage,
    required this.businessId,
    required this.encodedTitle,
    this.onSetPrimary,
    this.onDelete,
  });

  final BusinessBranchLocation location;
  final bool canManage;
  final String businessId;
  final String encodedTitle;
  final VoidCallback? onSetPrimary;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final locale = Localizations.localeOf(context).languageCode;
    final cityName = location.displayCityName(localeCode: locale);
    final hoursSummary = summarizeOwnerLocationWorkHours(location.workHours);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    cityName,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                  ),
                ),
                if (location.isPrimary)
                  Chip(
                    label: Text(l10n.ownerLocationPrimaryBadge),
                    visualDensity: VisualDensity.compact,
                    backgroundColor: AppTheme.kzBlue.withValues(alpha: 0.12),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            Text(location.address),
            if (location.phone != null && location.phone!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text('${l10n.ownerPhoneLabel}: ${location.phone}'),
            ],
            if (hoursSummary.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text('${l10n.ownerWorkHoursSection}: $hoursSummary'),
            ],
            if (canManage) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  OutlinedButton(
                    onPressed: () => context.push(
                      '/owner/locations/$businessId/${location.id}/edit?title=$encodedTitle',
                    ),
                    child: Text(l10n.ownerLocationEdit),
                  ),
                  if (onSetPrimary != null)
                    OutlinedButton(
                      onPressed: onSetPrimary,
                      child: Text(l10n.ownerLocationSetPrimary),
                    ),
                  if (onDelete != null)
                    TextButton(
                      onPressed: onDelete,
                      child: Text(l10n.ownerLocationDelete),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
