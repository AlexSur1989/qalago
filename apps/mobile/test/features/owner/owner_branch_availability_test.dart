import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/owner/owner_branch_availability.dart';

void main() {
  group('branchAvailabilityFromJson', () {
    test('ALL menu item loads as ALL', () {
      final state = branchAvailabilityFromJson({
        'mode': 'ALL',
        'locationIds': [],
      });
      expect(state.mode, 'ALL');
      expect(state.selectedLocationIds, isEmpty);
    });

    test('SELECTED menu item loads selected locations', () {
      final state = branchAvailabilityFromJson({
        'mode': 'SELECTED',
        'locationIds': ['l2', 'l1'],
      });
      expect(state.mode, 'SELECTED');
      expect(state.selectedLocationIds, ['l2', 'l1']);
    });

    test('SELECTED promotion loads correctly', () {
      final dto = branchAvailabilityToDto(
        branchAvailabilityFromJson({
          'mode': 'SELECTED',
          'locationIds': ['p1'],
        }),
      );
      expect(dto['mode'], 'SELECTED');
      expect(dto['locationIds'], ['p1']);
    });
  });

  group('branchAvailabilityToDto', () {
    test('Menu ALL payload correct', () {
      expect(
        branchAvailabilityToDto(const BranchAvailabilityState()),
        {'mode': 'ALL', 'locationIds': <String>[]},
      );
    });

    test('Menu SELECTED payload deduplicates ids', () {
      final dto = branchAvailabilityToDto(
        const BranchAvailabilityState(
          mode: 'SELECTED',
          selectedLocationIds: ['b', 'a', 'b'],
        ),
      );
      expect(dto['locationIds'], ['a', 'b']);
    });

    test('Promotion ALL payload correct', () {
      final payload = buildPromotionMutationPayload(
        fields: {'title': 'Promo'},
        isCreate: true,
        branchState: const BranchAvailabilityState(),
      );
      expect(payload['branchAvailability'], {'mode': 'ALL', 'locationIds': []});
    });
  });

  group('buildMenuItemMutationPayload preservation', () {
    test('Editing menu price preserves branch scope when unchanged', () {
      const initial = BranchAvailabilityState(
        mode: 'SELECTED',
        selectedLocationIds: ['loc-1'],
      );
      final initialDto = branchAvailabilityToDto(initial);
      final payload = buildMenuItemMutationPayload(
        fields: {'price': 1200},
        isCreate: false,
        initialBranchDto: initialDto,
        branchState: initial,
      );
      expect(payload.containsKey('branchAvailability'), isFalse);
      expect(payload['price'], 1200);
    });

    test('Editing promotion title preserves branch scope when unchanged', () {
      const initial = BranchAvailabilityState(
        mode: 'SELECTED',
        selectedLocationIds: ['loc-2'],
      );
      final payload = buildPromotionMutationPayload(
        fields: {'title': 'New title'},
        isCreate: false,
        initialBranchDto: branchAvailabilityToDto(initial),
        branchState: initial,
      );
      expect(payload.containsKey('branchAvailability'), isFalse);
      expect(payload['title'], 'New title');
    });

    test('Create includes branchAvailability', () {
      final payload = buildMenuItemMutationPayload(
        fields: {'title': 'Item'},
        isCreate: true,
        branchState: const BranchAvailabilityState(
          mode: 'SELECTED',
          selectedLocationIds: ['x'],
        ),
      );
      expect(payload['branchAvailability'], {
        'mode': 'SELECTED',
        'locationIds': ['x'],
      });
    });
  });

  group('validateBranchAvailabilitySubmit', () {
    test('zero locations blocks SELECTED', () {
      expect(
        validateBranchAvailabilitySubmit(
          const BranchAvailabilityState(mode: 'SELECTED', selectedLocationIds: ['x']),
          [],
        ),
        BranchAvailabilityValidationReason.noBranches,
      );
    });

    test('SELECTED requires at least one known id', () {
      expect(
        validateBranchAvailabilitySubmit(
          const BranchAvailabilityState(mode: 'SELECTED', selectedLocationIds: []),
          ['l1'],
        ),
        BranchAvailabilityValidationReason.selectAtLeastOne,
      );
    });
  });
}
