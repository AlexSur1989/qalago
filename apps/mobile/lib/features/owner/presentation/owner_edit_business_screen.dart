import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_profile_errors.dart';
import '../owner_subcategory_edit.dart';
import 'widgets/owner_subcategories_section.dart';

class OwnerEditBusinessScreen extends ConsumerStatefulWidget {
  const OwnerEditBusinessScreen({
    super.key,
    required this.businessId,
    required this.businessTitle,
  });

  final String businessId;
  final String businessTitle;

  @override
  ConsumerState<OwnerEditBusinessScreen> createState() =>
      _OwnerEditBusinessScreenState();
}

class _OwnerEditBusinessScreenState
    extends ConsumerState<OwnerEditBusinessScreen> {
  final _titleController = TextEditingController();
  final _shortDescController = TextEditingController();
  final _descriptionController = TextEditingController();

  bool _initialized = false;
  bool _saving = false;

  @override
  void dispose() {
    _titleController.dispose();
    _shortDescController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _fillFromData(Map<String, dynamic> data) {
    if (_initialized) return;
    _titleController.text = data['title'] as String? ?? '';
    _shortDescController.text = data['shortDesc'] as String? ?? '';
    _descriptionController.text = data['description'] as String? ?? '';
    _initialized = true;
  }

  Future<void> _save() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.ownerRequiredBusinessTitle)),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ref.read(catalogRepositoryProvider).updateBusiness(
        widget.businessId,
        buildOwnerBusinessIdentityPatch({
          'title': title,
          'shortDesc': _shortDescController.text.trim(),
          'description': _descriptionController.text.trim(),
        }),
      );
      ref.invalidate(
        businessDetailsProvider(
          BusinessDetailRequest(businessId: widget.businessId),
        ),
      );
      ref.invalidate(myBusinessEntriesProvider);
      ref.invalidate(businessesProvider);
      ref.invalidate(featuredBusinessesProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.ownerProfileSaved)),
        );
        Navigator.pop(context);
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
    final detailsAsync = ref.watch(
      businessDetailsProvider(
        BusinessDetailRequest(businessId: widget.businessId),
      ),
    );
    final encodedTitle = Uri.encodeComponent(widget.businessTitle);

    return Scaffold(
      appBar: AppBar(
        leading: qalagoBackLeading(context, fallbackLocation: '/owner'),
        title: Text(widget.businessTitle),
      ),
      body: detailsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(
                businessDetailsProvider(
                  BusinessDetailRequest(businessId: widget.businessId),
                ),
              ),
        ),
        data: (data) {
          _fillFromData(data);
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.screen),
            children: [
              Text(
                context.l10n.ownerEditProfileTitle,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 16),
              Card(
                child: ListTile(
                  title: Text(context.l10n.ownerLocationsManageHintTitle),
                  subtitle: Text(context.l10n.ownerLocationsManageHintBody),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push(
                    '/owner/locations/${widget.businessId}?title=$encodedTitle',
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _titleController,
                decoration: InputDecoration(labelText: context.l10n.ownerFieldTitle),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _shortDescController,
                decoration: InputDecoration(labelText: context.l10n.ownerFieldShortDesc),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _descriptionController,
                decoration: InputDecoration(labelText: context.l10n.ownerFieldFullDesc),
                minLines: 3,
                maxLines: 6,
              ),
              const SizedBox(height: 20),
              OwnerSubcategoriesSection(
                businessId: widget.businessId,
                businessData: data,
              ),
              const SizedBox(height: 28),
              FilledButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(context.l10n.commonSave),
              ),
            ],
          );
        },
      ),
    );
  }
}
