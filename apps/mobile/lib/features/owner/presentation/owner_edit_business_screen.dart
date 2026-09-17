import 'package:flutter/material.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_profile_errors.dart';
import '../owner_subcategory_edit.dart';
import '../../location/business_location_value.dart';
import '../../location/widgets/business_address_location_field.dart';
import 'widgets/owner_subcategories_section.dart';

Map<String, String> _parseWorkHours(dynamic raw) {
  if (raw is! Map) return {};
  return raw.map((key, value) => MapEntry(key.toString(), value.toString()));
}

Map<String, String> _buildWorkHours({
  required String weekdays,
  required String saturday,
  required String sunday,
}) {
  return {
    'mon': weekdays,
    'tue': weekdays,
    'wed': weekdays,
    'thu': weekdays,
    'fri': weekdays,
    'sat': saturday,
    'sun': sunday,
  };
}

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
  BusinessLocationValue _location = const BusinessLocationValue();
  String _citySlug = 'uralsk';
  final _phoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _instagramController = TextEditingController();
  final _websiteController = TextEditingController();
  final _weekdaysHoursController = TextEditingController();
  final _saturdayHoursController = TextEditingController();
  final _sundayHoursController = TextEditingController();

  bool _initialized = false;
  bool _saving = false;

  @override
  void dispose() {
    _titleController.dispose();
    _shortDescController.dispose();
    _descriptionController.dispose();
    _phoneController.dispose();
    _whatsappController.dispose();
    _instagramController.dispose();
    _websiteController.dispose();
    _weekdaysHoursController.dispose();
    _saturdayHoursController.dispose();
    _sundayHoursController.dispose();
    super.dispose();
  }

  void _fillFromData(Map<String, dynamic> data) {
    if (_initialized) return;
    _titleController.text = data['title'] as String? ?? '';
    _shortDescController.text = data['shortDesc'] as String? ?? '';
    _descriptionController.text = data['description'] as String? ?? '';
    _location = BusinessLocationValue.fromBusinessJson(data) ??
        BusinessLocationValue(displayAddress: data['address'] as String? ?? '');
    _citySlug = (data['city'] as Map?)?['slug'] as String? ?? _citySlug;
    _phoneController.text = data['phone'] as String? ?? '';
    _whatsappController.text = data['whatsapp'] as String? ?? '';
    _instagramController.text = data['instagram'] as String? ?? '';
    _websiteController.text = data['website'] as String? ?? '';

    final hours = _parseWorkHours(data['workHours']);
    final weekdays = hours['mon'] ?? hours['tue'] ?? '09:00-22:00';
    _weekdaysHoursController.text = weekdays;
    _saturdayHoursController.text = hours['sat'] ?? weekdays;
    _sundayHoursController.text = hours['sun'] ?? weekdays;
    _initialized = true;
  }

  Future<void> _save() async {
    final title = _titleController.text.trim();
    final address = _location.displayAddress.trim();
    if (title.isEmpty || address.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.ownerRequiredNameAddress)),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      await ref.read(catalogRepositoryProvider).updateBusiness(
        widget.businessId,
        buildOwnerProfileFieldsPatch({
          'title': title,
          'shortDesc': _shortDescController.text.trim(),
          'description': _descriptionController.text.trim(),
          'address': address,
          ..._location.toPayload(),
          'phone': _phoneController.text.trim(),
          'whatsapp': _whatsappController.text.trim(),
          'instagram': _instagramController.text.trim(),
          'website': _websiteController.text.trim(),
          'workHours': _buildWorkHours(
            weekdays: _weekdaysHoursController.text.trim(),
            saturday: _saturdayHoursController.text.trim(),
            sunday: _sundayHoursController.text.trim(),
          ),
        }),
      );
      ref.invalidate(businessDetailsProvider(widget.businessId));
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
    final detailsAsync = ref.watch(businessDetailsProvider(widget.businessId));

    return Scaffold(
      appBar: AppBar(
        leading: qalagoBackLeading(context, fallbackLocation: '/owner'),
        title: Text(widget.businessTitle),
      ),
      body: detailsAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: '$e',
          onRetry: () => ref.invalidate(businessDetailsProvider(widget.businessId)),
        ),
        data: (data) {
          _fillFromData(data);
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.screen),
            children: [
              Text(                context.l10n.ownerEditProfileTitle,
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
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
              const SizedBox(height: 12),
              BusinessAddressLocationField(
                citySlug: _citySlug,
                value: _location,
                onChanged: (next) => setState(() => _location = next),
                addressLabel: context.l10n.businessAddress,
                addressRequiredMessage: context.l10n.ownerRequiredNameAddress,
              ),
              const SizedBox(height: 20),
              OwnerSubcategoriesSection(
                businessId: widget.businessId,
                businessData: data,
              ),
              const SizedBox(height: 20),
              Text(                context.l10n.ownerContactsSection,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phoneController,
                decoration: InputDecoration(labelText: context.l10n.ownerPhoneLabel),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _whatsappController,
                decoration: const InputDecoration(labelText: 'WhatsApp'),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _instagramController,
                decoration: const InputDecoration(labelText: 'Instagram'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _websiteController,
                decoration: InputDecoration(labelText: context.l10n.businessWebsite),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 20),
              Text(                context.l10n.ownerWorkHoursSection,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                context.l10n.ownerWorkHoursFormat,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _weekdaysHoursController,
                decoration: InputDecoration(labelText: context.l10n.ownerWorkHoursWeekdays),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _saturdayHoursController,
                decoration: InputDecoration(labelText: context.l10n.ownerWorkHoursSaturday),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _sundayHoursController,
                decoration: InputDecoration(labelText: context.l10n.ownerWorkHoursSunday),
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
