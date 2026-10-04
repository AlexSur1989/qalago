import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/onboarding_providers.dart';
import '../utils/onboarding_errors.dart';
import '../../../core/theme/app_theme.dart';
import '../../location/business_location_value.dart';
import '../../location/widgets/business_address_location_field.dart';
import '../../legal/legal_contextual_errors.dart';
import '../../legal/widgets/contextual_legal_section.dart';

class BusinessApplyScreen extends ConsumerStatefulWidget {
  const BusinessApplyScreen({super.key, this.applicationId});

  final String? applicationId;

  @override
  ConsumerState<BusinessApplyScreen> createState() => _BusinessApplyScreenState();
}

class _BusinessApplyScreenState extends ConsumerState<BusinessApplyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  BusinessLocationValue _location = const BusinessLocationValue();
  final _phoneController = TextEditingController();
  final _descController = TextEditingController();
  String? _selectedCategoryId;
  String? _draftId;
  String _status = 'DRAFT';
  String? _rejectionReason;
  bool _loading = false;
  final _applyLegalKey = GlobalKey<ContextualLegalSectionState>();

  @override
  void initState() {
    super.initState();
    _draftId = widget.applicationId;
    if (_draftId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadDraft(_draftId!));
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _phoneController.dispose();
    _descController.dispose();
    super.dispose();
  }

  bool get _readOnly =>
      _status == 'PENDING' || _status == 'APPROVED' || _status == 'CANCELLED';

  Future<void> _loadDraft(String id) async {
    final app = await ref.read(onboardingRepositoryProvider).getApplication(id);
    _titleController.text = app['title'] as String? ?? '';
    _location = BusinessLocationValue.fromApplicationJson(app) ??
        BusinessLocationValue(displayAddress: app['address'] as String? ?? '');
    _phoneController.text = app['phone'] as String? ?? '';
    _descController.text = app['shortDesc'] as String? ?? '';
    _selectedCategoryId = (app['category'] as Map?)?['id'] as String?;
    _status = app['status'] as String? ?? 'DRAFT';
    _rejectionReason = app['rejectionReason'] as String?;
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.onboardingAddBusinessTitle)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.screen),
          children: [
            Text(
              l10n.onboardingApplyIntro,
              style: const TextStyle(color: AppTheme.textMuted),
            ),
            if (_rejectionReason != null) ...[
              const SizedBox(height: 12),
              Text(
                l10n.onboardingRejectionReason(_rejectionReason!),
                style: TextStyle(color: AppTheme.error),
              ),
            ],
            const SizedBox(height: 24),
            TextFormField(
              controller: _titleController,
              enabled: !_readOnly,
              decoration: InputDecoration(labelText: l10n.onboardingNameLabel),
              validator: (v) =>
                  v == null || v.trim().length < 2 ? l10n.onboardingNameRequired : null,
            ),
            const SizedBox(height: 16),
            categoriesAsync.when(
              data: (categories) {
                _selectedCategoryId ??= categories.isNotEmpty ? categories.first.id : null;
                return DropdownButtonFormField<String>(
                  value: _selectedCategoryId,
                  decoration: InputDecoration(labelText: l10n.onboardingCategoryLabel),
                  items: categories
                      .map((c) => DropdownMenuItem(value: c.id, child: Text(c.title)))
                      .toList(),
                  onChanged: _readOnly ? null : (v) => setState(() => _selectedCategoryId = v),
                );
              },
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text(mapOnboardingError(l10n, e)),
            ),
            const SizedBox(height: 16),
            BusinessAddressLocationField(
              citySlug: ref.watch(cityProvider).slug,
              readOnly: _readOnly,
              value: _location,
              onChanged: (next) => setState(() => _location = next),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              enabled: !_readOnly,
              decoration: InputDecoration(labelText: l10n.onboardingPhoneLabel),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descController,
              enabled: !_readOnly,
              maxLines: 3,
              decoration: InputDecoration(labelText: l10n.onboardingDescriptionLabel),
            ),
            const SizedBox(height: 24),
            if (!_readOnly) ...[
              ContextualLegalSection(
                key: _applyLegalKey,
                contextKey: 'BUSINESS_APPLICATION',
              ),
              OutlinedButton(
                onPressed: _loading ? null : _saveDraft,
                child: Text(_loading ? l10n.onboardingSaving : l10n.onboardingSaveDraft),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _loading ? null : _submit,
                child: Text(_loading ? l10n.onboardingSubmitting : l10n.onboardingSubmitReview),
              ),
            ],
            if (_status == 'APPROVED')
              FilledButton(
                onPressed: () => context.go('/owner'),
                child: Text(l10n.onboardingOpenCabinet),
              ),
          ],
        ),
      ),
    );
  }

  Map<String, dynamic> _payload() {
    final citySlug = ref.read(cityProvider).slug;
    return {
      'title': _titleController.text.trim(),
      'categoryId': _selectedCategoryId,
      'citySlug': citySlug,
      'address': _location.displayAddress.trim(),
      ..._location.toPayload(),
      if (_phoneController.text.trim().isNotEmpty) 'phone': _phoneController.text.trim(),
      if (_descController.text.trim().isNotEmpty) 'shortDesc': _descController.text.trim(),
    };
  }

  Future<void> _saveDraft() async {
    final l10n = context.l10n;
    if (!_formKey.currentState!.validate() || _selectedCategoryId == null) return;
    setState(() => _loading = true);
    try {
      final repo = ref.read(onboardingRepositoryProvider);
      final app = _draftId == null
          ? await repo.createApplication(_payload())
          : await repo.updateApplication(_draftId!, _payload());
      _draftId = app['id'] as String?;
      _status = app['status'] as String? ?? 'DRAFT';
      ref.invalidate(myApplicationsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.onboardingDraftSaved)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapOnboardingError(l10n, e))),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    final l10n = context.l10n;
    if (!_formKey.currentState!.validate()) return;
    if (!_location.hasValidCoordinates) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.businessLocationRequired)),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final repo = ref.read(onboardingRepositoryProvider);
      if (_draftId == null) {
        final created = await repo.createApplication(_payload());
        _draftId = created['id'] as String?;
      } else {
        await repo.updateApplication(_draftId!, _payload());
      }
      final legalOk = await _applyLegalKey.currentState?.ensureAccepted() ?? true;
      if (!legalOk) return;
      await repo.submitApplication(_draftId!);
      ref.invalidate(myApplicationsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.onboardingSubmitted)),
        );
        context.push('/business/applications');
      }
    } catch (e) {
      if (mounted) {
        if (e.toString().contains('LEGAL_')) {
          await _applyLegalKey.currentState?.refresh();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              e.toString().contains('LEGAL_')
                  ? mapContextualLegalError(l10n, e)
                  : mapOnboardingError(l10n, e),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
