import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/location/business_location_value.dart';
import 'package:qalago_mobile/features/location/widgets/business_address_location_field.dart';
import 'package:qalago_mobile/features/location/widgets/business_location_picker.dart';

import '../../support/l10n_test_harness.dart';

void main() {
  testWidgets('adjust on map opens fullscreen picker with expanded shared map',
      (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: wrapWithL10n(
          Scaffold(
            body: BusinessAddressLocationField(
              citySlug: 'uralsk',
              value: const BusinessLocationValue(
                displayAddress: 'Abay 10',
                latitude: 51.22,
                longitude: 51.38,
                source: BusinessLocationSource.geocoded,
              ),
              onChanged: (_) {},
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.edit_location_alt_outlined));
    await tester.pumpAndSettle();

    expect(find.byType(Dialog), findsOneWidget);
    final picker = tester.widget<BusinessLocationPicker>(
      find.byType(BusinessLocationPicker),
    );
    expect(picker.mapExpanded, isTrue);
    expect(picker.initialLatitude, 51.22);
    expect(picker.initialLongitude, 51.38);
  });
}
