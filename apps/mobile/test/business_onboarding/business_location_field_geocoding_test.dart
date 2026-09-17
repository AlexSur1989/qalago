import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/location/business_location_value.dart';
import 'package:qalago_mobile/features/location/geocoding_repository.dart';
import 'package:qalago_mobile/features/location/widgets/business_address_location_field.dart';
import 'package:qalago_mobile/l10n/app_localizations.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

class _CountingGeocodingRepository extends GeocodingRepository {
  _CountingGeocodingRepository() : super(Dio());

  int autocompleteCalls = 0;

  @override
  Future<List<GeocodingSuggestion>> autocomplete({
    required String query,
    required String citySlug,
    required String language,
    CancelToken? cancelToken,
  }) async {
    autocompleteCalls++;
    return const [];
  }
}

void main() {
  testWidgets('BusinessAddressLocationField does not geocode on mount', (tester) async {
    final geocoding = _CountingGeocodingRepository();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          geocodingRepositoryProvider.overrideWithValue(geocoding),
        ],
        child: MaterialApp(
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          home: Scaffold(
            body: BusinessAddressLocationField(
              citySlug: 'uralsk',
              value: const BusinessLocationValue(),
              onChanged: (_) {},
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle(const Duration(milliseconds: 400));

    expect(geocoding.autocompleteCalls, 0);
  });
}
