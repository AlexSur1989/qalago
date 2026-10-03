import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qalago_mobile/features/owner/providers/owner_providers.dart';

void main() {
  test('onOwnerBusinessSelected invalidates plan providers for business', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    final businessId = 'biz-a';
    container.read(selectedOwnerBusinessIdProvider.notifier).select(businessId);

    expect(container.read(selectedOwnerBusinessIdProvider), businessId);

    onOwnerBusinessSelected(container, 'biz-b');
    expect(container.read(selectedOwnerBusinessIdProvider), 'biz-b');
  });
}
