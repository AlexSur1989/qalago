import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../auth/providers/auth_provider.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../ads/data/ad_models.dart';
import '../../../ads/widgets/vip_banner_ad.dart';
import '../../presentation/widgets/owner_scaffold.dart';
import '../../providers/owner_providers.dart';
import '../data/monetization_labels.dart';
import '../data/monetization_models.dart';
import '../providers/monetization_providers.dart';

class VipCreativeScreen extends ConsumerStatefulWidget {
  const VipCreativeScreen({super.key, required this.checkoutExtra});

  final Map<String, dynamic> checkoutExtra;

  @override
  ConsumerState<VipCreativeScreen> createState() => _VipCreativeScreenState();
}

class _VipCreativeScreenState extends ConsumerState<VipCreativeScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _buttonController = TextEditingController(text: 'Подробнее');
  String? _imageUrl;
  bool _uploading = false;
  bool _saving = false;
  String? _error;
  bool _showPreview = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _buttonController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    setState(() {
      _uploading = true;
      _error = null;
    });
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        imageQuality: 85,
      );
      if (file == null) return;
      final bytes = await file.readAsBytes();
      final catalog = ref.read(catalogRepositoryProvider);
      final url = await catalog.uploadImage(file.path, bytes, file.name);
      setState(() => _imageUrl = url);
    } catch (_) {
      setState(() => _error = 'Не удалось загрузить изображение.');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  AdItemModel _previewItem(String businessId) {
    return AdItemModel(
      campaignId: 'preview',
      placementId: 'preview',
      placementCode: 'HOME_VIP_BANNER',
      position: 1,
      sponsored: true,
      displayLabel: 'Реклама',
      creative: AdCreativeModel(
        id: 'preview',
        title: _titleController.text.trim().isEmpty
            ? 'Заголовок баннера'
            : _titleController.text.trim(),
        imageUrl: _imageUrl,
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        buttonText: _buttonController.text.trim().isEmpty
            ? 'Подробнее'
            : _buttonController.text.trim(),
        targetType: 'BUSINESS',
        targetId: businessId,
      ),
      business: {'id': businessId},
    );
  }

  Future<void> _continueToConfirm() async {
    final businessId = widget.checkoutExtra['businessId'] as String;
    final title = _titleController.text.trim();
    if (title.length < 2) {
      setState(() => _error = 'Введите заголовок (минимум 2 символа).');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final catalog = ref.read(catalogRepositoryProvider);
      final creativeRaw = await catalog.createMonetizationCreative({
        'businessId': businessId,
        'type': 'BANNER',
        'title': title,
        if (_imageUrl != null) 'imageUrl': _imageUrl,
        if (_descriptionController.text.trim().isNotEmpty)
          'description': _descriptionController.text.trim(),
        if (_buttonController.text.trim().isNotEmpty)
          'buttonText': _buttonController.text.trim(),
        'targetType': 'BUSINESS',
        'targetId': businessId,
      });
      final creative = MonetizationCreative.fromJson(creativeRaw);
      if (!mounted) return;
      context.push(
        '/owner/monetization/confirm',
        extra: {
          ...widget.checkoutExtra,
          'creativeId': creative.id,
        },
      );
    } catch (_) {
      setState(() => _error = 'Не удалось сохранить баннер.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final businessId = widget.checkoutExtra['businessId'] as String? ?? '';

    return OwnerScaffold(
      title: 'VIP-баннер',
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          const Text(vipModerationNotice),
          const SizedBox(height: 16),
          if (_showPreview) ...[
            VipBannerAd(item: _previewItem(businessId), previewMode: true),
            const SizedBox(height: 16),
          ],
          TextField(
            controller: _titleController,
            decoration: const InputDecoration(labelText: 'Заголовок'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descriptionController,
            decoration: const InputDecoration(labelText: 'Описание (необязательно)'),
            maxLines: 2,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _buttonController,
            decoration: const InputDecoration(labelText: 'Текст кнопки'),
          ),
          const SizedBox(height: 16),
          if (_imageUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                AppConstants.resolveMediaUrl(_imageUrl),
                height: 140,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _uploading ? null : _pickImage,
            icon: _uploading
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.image_outlined),
            label: Text(_imageUrl == null ? 'Загрузить изображение' : 'Заменить изображение'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: () => setState(() => _showPreview = !_showPreview),
            child: Text(_showPreview ? 'Скрыть предпросмотр' : 'Предпросмотр'),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _saving ? null : _continueToConfirm,
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.kzBlue,
              minimumSize: const Size.fromHeight(48),
            ),
            child: _saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Продолжить к заказу'),
          ),
        ],
      ),
    );
  }
}
