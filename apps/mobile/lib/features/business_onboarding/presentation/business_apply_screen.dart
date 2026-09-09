import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/city_provider.dart';
import '../../../core/theme/app_spacing.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/onboarding_providers.dart';
import '../utils/onboarding_errors.dart';

class BusinessApplyScreen extends ConsumerStatefulWidget {
  const BusinessApplyScreen({super.key, this.applicationId});

  final String? applicationId;

  @override
  ConsumerState<BusinessApplyScreen> createState() => _BusinessApplyScreenState();
}

class _BusinessApplyScreenState extends ConsumerState<BusinessApplyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _descController = TextEditingController();
  String? _selectedCategoryId;
  String? _draftId;
  String _status = 'DRAFT';
  String? _rejectionReason;
  bool _loading = false;

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
    _addressController.dispose();
    _phoneController.dispose();
    _descController.dispose();
    super.dispose();
  }

  bool get _readOnly =>
      _status == 'PENDING' || _status == 'APPROVED' || _status == 'CANCELLED';

  Future<void> _loadDraft(String id) async {
    final app = await ref.read(onboardingRepositoryProvider).getApplication(id);
    _titleController.text = app['title'] as String? ?? '';
    _addressController.text = app['address'] as String? ?? '';
    _phoneController.text = app['phone'] as String? ?? '';
    _descController.text = app['shortDesc'] as String? ?? '';
    _selectedCategoryId = (app['category'] as Map?)?['id'] as String?;
    _status = app['status'] as String? ?? 'DRAFT';
    _rejectionReason = app['rejectionReason'] as String?;
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Добавить новый бизнес')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.screen),
          children: [
            const Text(
              'Заявка будет проверена администрацией QalaGo. Доступ к кабинету появится после одобрения.',
              style: TextStyle(color: Colors.black54),
            ),
            if (_rejectionReason != null) ...[
              const SizedBox(height: 12),
              Text('Причина отклонения: $_rejectionReason', style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 24),
            TextFormField(
              controller: _titleController,
              enabled: !_readOnly,
              decoration: const InputDecoration(labelText: 'Название *'),
              validator: (v) => v == null || v.trim().length < 2 ? 'Введите название' : null,
            ),
            const SizedBox(height: 16),
            categoriesAsync.when(
              data: (categories) {
                _selectedCategoryId ??= categories.isNotEmpty ? categories.first.id : null;
                return DropdownButtonFormField<String>(
                  value: _selectedCategoryId,
                  decoration: const InputDecoration(labelText: 'Категория *'),
                  items: categories
                      .map((c) => DropdownMenuItem(value: c.id, child: Text(c.title)))
                      .toList(),
                  onChanged: _readOnly ? null : (v) => setState(() => _selectedCategoryId = v),
                );
              },
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text(mapOnboardingError(e)),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _addressController,
              enabled: !_readOnly,
              decoration: const InputDecoration(labelText: 'Адрес *'),
              validator: (v) => v == null || v.trim().length < 2 ? 'Введите адрес' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              enabled: !_readOnly,
              decoration: const InputDecoration(labelText: 'Телефон'),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descController,
              enabled: !_readOnly,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Краткое описание'),
            ),
            const SizedBox(height: 24),
            if (!_readOnly) ...[
              OutlinedButton(
                onPressed: _loading ? null : _saveDraft,
                child: Text(_loading ? 'Сохранение…' : 'Сохранить черновик'),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _loading ? null : _submit,
                child: Text(_loading ? 'Отправка…' : 'Отправить на проверку'),
              ),
            ],
            if (_status == 'APPROVED')
              FilledButton(
                onPressed: () => context.go('/owner'),
                child: const Text('Открыть кабинет'),
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
      'address': _addressController.text.trim(),
      if (_phoneController.text.trim().isNotEmpty) 'phone': _phoneController.text.trim(),
      if (_descController.text.trim().isNotEmpty) 'shortDesc': _descController.text.trim(),
    };
  }

  Future<void> _saveDraft() async {
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
          const SnackBar(content: Text('Черновик сохранён')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapOnboardingError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final repo = ref.read(onboardingRepositoryProvider);
      if (_draftId == null) {
        final created = await repo.createApplication(_payload());
        _draftId = created['id'] as String?;
      } else {
        await repo.updateApplication(_draftId!, _payload());
      }
      await repo.submitApplication(_draftId!);
      ref.invalidate(myApplicationsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Заявка отправлена на проверку')),
        );
        context.push('/business/applications');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapOnboardingError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
