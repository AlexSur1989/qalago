import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qalago_mobile/core/locale/l10n_extension.dart';

import '../../../core/providers/city_provider.dart' show citiesProvider, cityProvider;
import '../../../core/rbac/business_access.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/navigation/navigation_utils.dart';
import '../../../shared/widgets/error_view.dart';
import '../../../shared/widgets/loading_view.dart';
import '../../auth/providers/auth_provider.dart';
import '../../location/business_location_value.dart';
import '../../location/widgets/business_address_location_field.dart';
import '../owner_business_location.dart';
import '../owner_location_errors.dart';
import '../providers/owner_locations_provider.dart';
import '../providers/owner_providers.dart';

class OwnerLocationEditScreen extends ConsumerStatefulWidget {
  const OwnerLocationEditScreen({
    super.key,
    required this.businessId,
    required this.businessTitle,
    this.locationId,
  });

  final String businessId;
  final String businessTitle;
  final String? locationId;

  bool get isCreate => locationId == null || locationId!.isEmpty;

  @override
  ConsumerState<OwnerLocationEditScreen> createState() =>
      _OwnerLocationEditScreenState();
}

class _OwnerLocationEditScreenState extends ConsumerState<OwnerLocationEditScreen> {
  String? _cityId;
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
    _phoneController.dispose();
    _whatsappController.dispose();
    _instagramController.dispose();
    _websiteController.dispose();
    _weekdaysHoursController.dispose();
    _saturdayHoursController.dispose();
    _sundayHoursController.dispose();
    super.dispose();
  }

  void _fillFromLocation(Map<String, dynamic> data, List<Map<String, dynamic>> cities) {
    if (_initialized) return;
    _cityId = data['cityId'] as String?;
    Map<String, dynamic>? matchedCity;
    for (final c in cities) {
      if (c['id'] == _cityId) {
        matchedCity = c;
        break;
      }
    }
    _citySlug = matchedCity?['slug'] as String? ?? _citySlug;
    _location = BusinessLocationValue.fromBusinessJson(data) ??
        BusinessLocationValue(displayAddress: data['address'] as String? ?? '');
    _phoneController.text = data['phone'] as String? ?? '';
    _whatsappController.text = data['whatsapp'] as String? ?? '';
    _instagramController.text = data['instagram'] as String? ?? '';
    _websiteController.text = data['website'] as String? ?? '';
    final hours = ownerLocationHoursFromRaw(
      parseOwnerLocationWorkHours(data['workHours']),
    );
    _weekdaysHoursController.text = hours.weekdays;
    _saturdayHoursController.text = hours.saturday;
    _sundayHoursController.text = hours.sunday;
    _initialized = true;
  }

  Future<void> _save({
    required bool canEditProfile,
    required bool canEditHours,
  }) async {
    final l10n = context.l10n;
    final address = _location.displayAddress.trim();
    final cityId = _cityId;
    if (widget.isCreate && (cityId == null || cityId.isEmpty || address.isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.ownerLocationValidationCityAddress)),
      );
      return;
    }
    if (!widget.isCreate && address.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.ownerRequiredNameAddress)),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final repo = ref.read(catalogRepositoryProvider);
      final workHours = canEditHours
          ? buildOwnerLocationWorkHours(
              weekdays: _weekdaysHoursController.text.trim(),
              saturday: _saturdayHoursController.text.trim(),
              sunday: _sundayHoursController.text.trim(),
            )
          : null;
      final locationSource = _location.source == BusinessLocationSource.manuallyAdjusted
          ? 'MANUALLY_ADJUSTED'
          : 'GEOCODED';

      if (widget.isCreate) {
        if (!canEditProfile) {
          throw StateError('forbidden');
        }
        final payload = buildCreateOwnerBusinessLocationPayload(
          cityId: cityId!,
          address: address,
          latitude: _location.latitude,
          longitude: _location.longitude,
          locationSource: _location.hasValidCoordinates ? locationSource : null,
          workHours: workHours,
          phone: _phoneController.text.trim(),
          whatsapp: _whatsappController.text.trim(),
          instagram: _instagramController.text.trim(),
          website: _websiteController.text.trim(),
        );
        await repo.createOwnerBusinessLocation(widget.businessId, payload);
      } else {
        final payload = buildUpdateOwnerBusinessLocationPayload(
          includeProfileFields: canEditProfile,
          includeHours: canEditHours,
          cityId: cityId,
          address: address,
          latitude: _location.latitude,
          longitude: _location.longitude,
          locationSource: locationSource,
          workHours: workHours,
          phone: _phoneController.text.trim(),
          whatsapp: _whatsappController.text.trim(),
          instagram: _instagramController.text.trim(),
          website: _websiteController.text.trim(),
        );
        await repo.updateOwnerBusinessLocation(
          widget.businessId,
          widget.locationId!,
          payload,
        );
      }
      ref.invalidate(ownerBusinessLocationsProvider(widget.businessId));
      ref.invalidate(myBusinessEntriesProvider);
      ref.invalidate(
        businessDetailsProvider(
          BusinessDetailRequest(businessId: widget.businessId),
        ),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.isCreate ? l10n.ownerLocationCreated : l10n.ownerLocationSaved,
            ),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(mapOwnerLocationError(l10n, e))),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final access = ref.watch(selectedBusinessAccessProvider);
    final canEditProfile = access != null &&
        hasPermission(access, BusinessPermission.businessProfileEdit);
    final canEditHours = access != null &&
        hasPermission(access, BusinessPermission.businessHoursEdit);
    final canSave = widget.isCreate ? canEditProfile : (canEditProfile || canEditHours);
    final citiesAsync = ref.watch(citiesProvider);

    return Scaffold(
      appBar: AppBar(
        leading: qalagoBackLeading(context),
        title: Text(
          widget.isCreate ? l10n.ownerLocationAdd : l10n.ownerLocationEdit,
        ),
      ),
      body: citiesAsync.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(
          message: mapOwnerLocationError(l10n, e),
          onRetry: () => ref.invalidate(citiesProvider),
        ),
        data: (cities) {
          if (!widget.isCreate && !_initialized) {
            return FutureBuilder<Map<String, dynamic>>(
              future: ref.read(catalogRepositoryProvider).fetchOwnerBusinessLocation(
                    widget.businessId,
                    widget.locationId!,
                  ),
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const LoadingView();
                }
                if (snapshot.hasError) {
                  return ErrorView(
                    message: mapOwnerLocationError(l10n, snapshot.error!),
                    onRetry: () => setState(() {}),
                  );
                }
                _fillFromLocation(snapshot.data!, cities);
                return _form(
                  context,
                  cities: cities,
                  canEditProfile: canEditProfile,
                  canEditHours: canEditHours,
                  canSave: canSave,
                );
              },
            );
          }
          if (widget.isCreate && !_initialized && cities.isNotEmpty) {
            final defaultCity = ref.read(cityProvider).slug;
            final match = cities.cast<Map<String, dynamic>>().firstWhere(
                  (c) => c['slug'] == defaultCity,
                  orElse: () => cities.first,
                );
            _cityId = match['id'] as String?;
            _citySlug = match['slug'] as String? ?? _citySlug;
            _initialized = true;
          }
          return _form(
            context,
            cities: cities,
            canEditProfile: canEditProfile,
            canEditHours: canEditHours,
            canSave: canSave,
          );
        },
      ),
    );
  }

  Widget _form(
    BuildContext context, {
    required List<Map<String, dynamic>> cities,
    required bool canEditProfile,
    required bool canEditHours,
    required bool canSave,
  }) {
    final l10n = context.l10n;
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.screen),
      children: [
        if (!canEditProfile && !canEditHours)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Text(l10n.errorForbidden),
          ),
        DropdownButtonFormField<String>(
          value: _cityId != null && cities.any((c) => c['id'] == _cityId)
              ? _cityId
              : null,
          decoration: InputDecoration(labelText: l10n.ownerLocationCity),
          items: cities
              .map(
                (c) => DropdownMenuItem<String>(
                  value: c['id'] as String,
                  child: Text(c['nameRu'] as String? ?? c['slug'] as String? ?? ''),
                ),
              )
              .toList(),
          onChanged: canEditProfile
              ? (id) {
                  setState(() {
                    _cityId = id;
                    final city = cities.firstWhere((c) => c['id'] == id);
                    _citySlug = city['slug'] as String? ?? _citySlug;
                  });
                }
              : null,
        ),
        const SizedBox(height: 12),
        BusinessAddressLocationField(
          citySlug: _citySlug,
          value: _location,
          onChanged: (next) => setState(() => _location = next),
          readOnly: !canEditProfile,
          addressLabel: l10n.businessAddress,
          addressRequiredMessage: l10n.ownerRequiredNameAddress,
        ),
        const SizedBox(height: 20),
        Text(
          l10n.ownerContactsSection,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _phoneController,
          readOnly: !canEditProfile,
          decoration: InputDecoration(labelText: l10n.ownerPhoneLabel),
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _whatsappController,
          readOnly: !canEditProfile,
          decoration: InputDecoration(labelText: l10n.ownerLocationWhatsapp),
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _instagramController,
          readOnly: !canEditProfile,
          decoration: InputDecoration(labelText: l10n.ownerLocationInstagram),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _websiteController,
          readOnly: !canEditProfile,
          decoration: InputDecoration(labelText: l10n.businessWebsite),
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 20),
        Text(
          l10n.ownerWorkHoursSection,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Text(
          l10n.ownerWorkHoursFormat,
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _weekdaysHoursController,
          readOnly: !canEditHours,
          decoration: InputDecoration(labelText: l10n.ownerWorkHoursWeekdays),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _saturdayHoursController,
          readOnly: !canEditHours,
          decoration: InputDecoration(labelText: l10n.ownerWorkHoursSaturday),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _sundayHoursController,
          readOnly: !canEditHours,
          decoration: InputDecoration(labelText: l10n.ownerWorkHoursSunday),
        ),
        const SizedBox(height: 28),
        FilledButton(
          onPressed: _saving || !canSave
              ? null
              : () => _save(
                    canEditProfile: canEditProfile,
                    canEditHours: canEditHours,
                  ),
          child: _saving
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(l10n.commonSave),
        ),
      ],
    );
  }
}
