import 'package:flutter/material.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
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
import '../widgets/monetization_purchase_unavailable.dart';
import '../../../../core/release/app_config_provider.dart';

class VipCreativeScreen extends ConsumerStatefulWidget {
  const VipCreativeScreen({super.key, required this.checkoutExtra});

  final Map<String, dynamic> checkoutExtra;

  @override
  ConsumerState<VipCreativeScreen> createState() => _VipCreativeScreenState();
}

class _VipCreativeScreenState extends ConsumerState<VipCreativeScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _buttonController = TextEditingController();
  String? _imageUrl;
  String? _imageUploadToken;
  bool _uploading = false;
  bool _saving = false;
  String? _error;
  bool _showPreview = false;
  bool _buttonDefaultApplied = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_buttonDefaultApplied) {
      _buttonController.text = context.l10n.ownerVipDefaultButton;
      _buttonDefaultApplied = true;
    }
  }

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
      final businessId = widget.checkoutExtra['businessId'] as String;
      final uploaded = await catalog.uploadImage(
        file.path,
        bytes,
        file.name,
        businessId: businessId,
      );
      setState(() {
        _imageUrl = uploaded.url;
        _imageUploadToken = uploaded.uploadToken;
      });
    } catch (_) {
      setState(() => _error = context.l10n.ownerVipImageLoadFailed);
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
      displayLabel: context.l10n.ownerAnalyticsAds,
      creative: AdCreativeModel(
        id: 'preview',
        title: _titleController.text.trim().isEmpty
            ? context.l10n.ownerVipHeadlineHint
            : _titleController.text.trim(),
        imageUrl: _imageUrl,
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        buttonText: _buttonController.text.trim().isEmpty
            ? context.l10n.ownerVipDefaultButton
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
      setState(() => _error = context.l10n.ownerVipTitleMinLength);
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
        if (_imageUploadToken != null) 'uploadToken': _imageUploadToken,
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
      setState(() => _error = context.l10n.ownerVipSaveFailed);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!ref.watch(canPurchaseAdsProvider)) {
      return OwnerScaffold(
        title: context.l10n.ownerVipBannerTitle,
        body: MonetizationPurchasesUnavailableBody(
          onViewCampaigns: () => context.push('/owner/monetization/campaigns'),
        ),
      );
    }
    final businessId = widget.checkoutExtra['businessId'] as String? ?? '';

    return OwnerScaffold(
      title: context.l10n.ownerVipBannerTitle,
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.screen),
        children: [
          Text(vipModerationNotice(context.l10n)),
          const SizedBox(height: 16),
          if (_showPreview) ...[
            VipBannerAd(item: _previewItem(businessId), previewMode: true),
            const SizedBox(height: 16),
          ],
          TextField(
            controller: _titleController,
            decoration: InputDecoration(labelText: context.l10n.ownerVipHeadlineLabel),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descriptionController,
            decoration: InputDecoration(labelText: context.l10n.ownerVipDescriptionOptional),
            maxLines: 2,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _buttonController,
            decoration: InputDecoration(labelText: context.l10n.ownerVipButtonLabel),
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
            label: Text(_imageUrl == null ? context.l10n.ownerVipUploadImage : context.l10n.ownerVipReplaceImage),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: TextStyle(color: AppTheme.error)),
          ],
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: () => setState(() => _showPreview = !_showPreview),
            child: Text(_showPreview ? context.l10n.ownerHidePreview : context.l10n.ownerShowPreview),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _saving ? null : _continueToConfirm,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            child: _saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(context.l10n.ownerContinueToOrder),
          ),
        ],
      ),
    );
  }
}
