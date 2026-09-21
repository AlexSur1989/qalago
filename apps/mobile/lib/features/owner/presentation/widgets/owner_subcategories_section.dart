import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/locale/app_locale_provider.dart';
import '../../../../core/locale/localized_content.dart';
import '../../../../core/locale/l10n_extension.dart';
import '../../../../core/rbac/business_access.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/models/models.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../categories/presentation/category_subcategory_filter.dart';
import '../../owner_profile_errors.dart';
import '../../owner_subcategory_edit.dart';
import '../../providers/owner_providers.dart';

class OwnerSubcategoriesSection extends ConsumerStatefulWidget {
  const OwnerSubcategoriesSection({
    super.key,
    required this.businessId,
    required this.businessData,
  });

  final String businessId;
  final Map<String, dynamic> businessData;

  @override
  ConsumerState<OwnerSubcategoriesSection> createState() =>
      _OwnerSubcategoriesSectionState();
}

class _OwnerSubcategoriesSectionState extends ConsumerState<OwnerSubcategoriesSection> {
  List<String> _selectedIds = const [];
  bool _initialized = false;
  bool _saving = false;

  @override
  void didUpdateWidget(covariant OwnerSubcategoriesSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.businessId != widget.businessId) {
      _initialized = false;
      _selectedIds = const [];
    }
  }

  void _ensureInitialized() {
    if (_initialized) return;
    _selectedIds = parseAssignedSubcategoryIds(widget.businessData);
    _initialized = true;
  }

  bool get _canEdit {
    final access = ref.watch(ownerBusinessAccessProvider(widget.businessId));
    if (access == null) return false;
    return hasPermission(access, BusinessPermission.businessProfileEdit);
  }

  Future<void> _saveSubcategories() async {
    if (!_canEdit || _saving) return;
    setState(() => _saving = true);
    try {
      await ref.read(catalogRepositoryProvider).updateBusiness(
            widget.businessId,
            buildSubcategoryIdsPatch(_selectedIds),
          );
      ref.invalidate(
        businessDetailsProvider(
          BusinessDetailRequest(businessId: widget.businessId),
        ),
      );
      ref.invalidate(myBusinessEntriesProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.ownerSubcategoriesSaved)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapOwnerProfileSaveError(context.l10n, e))),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    _ensureInitialized();
    final l10n = context.l10n;
    final localeCode = resolveLocaleCode(ref.watch(appLocaleCodeProvider));
    final categoryId = resolveBusinessCategoryId(widget.businessData);

    if (categoryId == null || categoryId.isEmpty) {
      return const SizedBox.shrink();
    }

    final subsAsync = ref.watch(categorySubcategoriesProvider(categoryId));

    return subsAsync.when(
      loading: () => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.section),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.ownerSubcategoriesSection,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            const LinearProgressIndicator(),
          ],
        ),
      ),
      error: (_, __) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.section),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.ownerSubcategoriesSection,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.ownerSubcategoriesLoadFailed,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
      data: (available) {
        if (available.isEmpty) {
          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.section),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.ownerSubcategoriesSection,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.ownerSubcategoriesEmpty,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.section),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.ownerSubcategoriesSection,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                l10n.ownerSubcategoriesHint,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final sub in available)
                    FilterChip(
                      label: Text(_subcategoryLabel(sub, localeCode)),
                      selected: _selectedIds.contains(sub.id),
                      onSelected: _canEdit
                          ? (selected) {
                              setState(() {
                                _selectedIds = toggleSubcategorySelection(
                                  _selectedIds,
                                  sub.id,
                                );
                              });
                            }
                          : null,
                    ),
                ],
              ),
              if (_canEdit) ...[
                const SizedBox(height: 16),
                FilledButton.tonal(
                  onPressed: _saving ? null : _saveSubcategories,
                  child: _saving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(l10n.ownerSaveSubcategories),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  String _subcategoryLabel(SubcategoryModel sub, String localeCode) {
    return taxonomyDisplayName(
      localeCode: localeCode,
      nameRu: sub.nameRu,
      nameKk: sub.nameKk,
    );
  }
}
