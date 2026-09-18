import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/locale/app_locale_provider.dart';
import '../../../core/locale/l10n_extension.dart';
import '../../../core/theme/app_theme.dart';
import '../business_location_value.dart';
import '../geocoding_repository.dart';
import 'business_location_picker.dart';

class BusinessAddressLocationField extends ConsumerStatefulWidget {
  const BusinessAddressLocationField({
    super.key,
    required this.citySlug,
    required this.value,
    required this.onChanged,
    this.readOnly = false,
    this.addressLabel,
    this.addressRequiredMessage,
  });

  final String citySlug;
  final BusinessLocationValue value;
  final ValueChanged<BusinessLocationValue> onChanged;
  final bool readOnly;
  final String? addressLabel;
  final String? addressRequiredMessage;

  @override
  ConsumerState<BusinessAddressLocationField> createState() =>
      _BusinessAddressLocationFieldState();
}

class _BusinessAddressLocationFieldState
    extends ConsumerState<BusinessAddressLocationField> {
  static const _debounceMs = 320;
  static const _minQueryLength = 3;

  final _addressController = TextEditingController();
  Timer? _debounce;
  CancelToken? _cancelToken;
  int _requestGen = 0;
  bool _loading = false;
  String? _error;
  List<GeocodingSuggestion> _suggestions = const [];

  @override
  void initState() {
    super.initState();
    _addressController.text = widget.value.displayAddress;
  }

  @override
  void didUpdateWidget(covariant BusinessAddressLocationField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value.displayAddress != widget.value.displayAddress &&
        _addressController.text != widget.value.displayAddress) {
      _addressController.text = widget.value.displayAddress;
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _cancelToken?.cancel();
    _addressController.dispose();
    super.dispose();
  }

  String get _language {
    final code = ref.read(appLocaleProvider).languageCode;
    return code == 'kk' ? 'kk' : 'ru';
  }

  void _scheduleAutocomplete(String query) {
    _debounce?.cancel();
    if (query.trim().length < _minQueryLength) {
      setState(() {
        _suggestions = const [];
        _loading = false;
        _error = null;
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: _debounceMs), () {
      _fetchSuggestions(query.trim());
    });
  }

  Future<void> _fetchSuggestions(String query) async {
    final gen = ++_requestGen;
    _cancelToken?.cancel();
    final token = CancelToken();
    _cancelToken = token;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await ref.read(geocodingRepositoryProvider).autocomplete(
            query: query,
            citySlug: widget.citySlug,
            language: _language,
            cancelToken: token,
          );
      if (!mounted || gen != _requestGen) return;
      setState(() {
        _suggestions = items;
        _loading = false;
      });
    } catch (_) {
      if (!mounted || gen != _requestGen) return;
      setState(() {
        _loading = false;
        _error = context.l10n.businessLocationGeocodingError;
        _suggestions = const [];
      });
    }
  }

  void _selectSuggestion(GeocodingSuggestion suggestion) {
    _addressController.text = suggestion.address;
    widget.onChanged(
      BusinessLocationValue(
        displayAddress: suggestion.address,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        source: BusinessLocationSource.geocoded,
      ),
    );
    setState(() => _suggestions = const []);
    _openLocationPicker();
  }

  void _openLocationPicker() {
    if (widget.readOnly || !widget.value.hasValidCoordinates) return;
    FocusManager.instance.primaryFocus?.unfocus();

    final lat = widget.value.latitude!;
    final lng = widget.value.longitude!;
    final l10n = context.l10n;

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return Dialog.fullscreen(
          child: Scaffold(
            body: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: BusinessLocationPicker(
                  mapExpanded: true,
                  initialLatitude: lat,
                  initialLongitude: lng,
                  instruction: l10n.businessLocationPickerHint,
                  confirmLabel: l10n.businessLocationConfirm,
                  cancelLabel: l10n.businessLocationCancel,
                  onCancelled: () => Navigator.of(dialogContext).pop(),
                  onConfirmed: (pickedLat, pickedLng) async {
                    final confirmed = await _confirmPicker(pickedLat, pickedLng);
                    if (!confirmed) {
                      if (dialogContext.mounted) {
                        ScaffoldMessenger.of(dialogContext).showSnackBar(
                          SnackBar(
                            content: Text(l10n.businessLocationOutOfCityBounds),
                          ),
                        );
                      }
                      return;
                    }
                    if (dialogContext.mounted) {
                      Navigator.of(dialogContext).pop();
                    }
                  },
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  bool _isOutOfCityGeocodingError(DioException error) {
    if (error.response?.statusCode != 400) return false;
    final data = error.response?.data;
    if (data is Map) {
      final message = data['message'];
      if (message is String) {
        return message.contains('outside the selected city geocoding area');
      }
      if (message is List) {
        return message.any(
          (item) =>
              item is String &&
              item.contains('outside the selected city geocoding area'),
        );
      }
    }
    return false;
  }

  Future<bool> _confirmPicker(double lat, double lng) async {
    var next = widget.value.copyWith(
      latitude: lat,
      longitude: lng,
      source: BusinessLocationSource.manuallyAdjusted,
    );
    try {
      final reverse = await ref.read(geocodingRepositoryProvider).reverse(
            latitude: lat,
            longitude: lng,
            citySlug: widget.citySlug,
            language: _language,
          );
      if (reverse != null && reverse.address.isNotEmpty) {
        _addressController.text = reverse.address;
        next = next.copyWith(displayAddress: reverse.address);
      }
    } on DioException catch (error) {
      if (_isOutOfCityGeocodingError(error)) {
        if (!mounted) return false;
        setState(() {
          _error = context.l10n.businessLocationOutOfCityBounds;
        });
        return false;
      }
      // Other failures: coordinates remain authoritative only when reverse is optional.
    } catch (_) {
      // Coordinates remain authoritative.
    }
    widget.onChanged(next);
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final label = widget.addressLabel ?? l10n.onboardingAddressLabel;
    final requiredMsg =
        widget.addressRequiredMessage ?? l10n.onboardingAddressRequired;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextFormField(
          controller: _addressController,
          enabled: !widget.readOnly,
          decoration: InputDecoration(
            labelText: label,
            suffixIcon: _loading
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : null,
          ),
          onChanged: (text) {
            widget.onChanged(
              widget.value.copyWith(displayAddress: text),
            );
            if (!widget.readOnly) _scheduleAutocomplete(text);
          },
          validator: (v) =>
              v == null || v.trim().length < 2 ? requiredMsg : null,
        ),
        if (_error != null) ...[
          const SizedBox(height: 6),
          Text(_error!, style: const TextStyle(color: AppTheme.error, fontSize: 12)),
        ],
        if (_suggestions.isNotEmpty && !widget.readOnly) ...[
          const SizedBox(height: 8),
          Material(
            elevation: 2,
            borderRadius: BorderRadius.circular(8),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _suggestions.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final item = _suggestions[index];
                return ListTile(
                  dense: true,
                  title: Text(item.label, maxLines: 2, overflow: TextOverflow.ellipsis),
                  onTap: () => _selectSuggestion(item),
                );
              },
            ),
          ),
        ],
        if (widget.value.hasValidCoordinates && !widget.readOnly) ...[
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: _openLocationPicker,
              icon: const Icon(Icons.edit_location_alt_outlined),
              label: Text(l10n.businessLocationAdjustOnMap),
            ),
          ),
        ],
        if (!widget.readOnly &&
            widget.value.displayAddress.trim().length >= 2 &&
            !widget.value.hasValidCoordinates) ...[
          const SizedBox(height: 8),
          Text(
            l10n.businessLocationRequired,
            style: const TextStyle(color: AppTheme.error, fontSize: 12),
          ),
        ],
      ],
    );
  }
}
