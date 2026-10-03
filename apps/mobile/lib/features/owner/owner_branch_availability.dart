/// Branch availability (ALL / SELECTED) — mirrors Business Web `branch-availability.ts`.

const branchAvailabilityModeAll = 'ALL';
const branchAvailabilityModeSelected = 'SELECTED';

class BranchAvailabilityState {
  const BranchAvailabilityState({
    this.mode = branchAvailabilityModeAll,
    this.selectedLocationIds = const [],
  });

  final String mode;
  final List<String> selectedLocationIds;

  BranchAvailabilityState copyWith({
    String? mode,
    List<String>? selectedLocationIds,
  }) {
    return BranchAvailabilityState(
      mode: mode ?? this.mode,
      selectedLocationIds: selectedLocationIds ?? this.selectedLocationIds,
    );
  }
}

BranchAvailabilityState branchAvailabilityFromJson(dynamic raw) {
  if (raw is! Map) {
    return const BranchAvailabilityState();
  }
  final mode = raw['mode'] as String? ?? branchAvailabilityModeAll;
  if (mode == branchAvailabilityModeAll) {
    return const BranchAvailabilityState();
  }
  final ids = raw['locationIds'];
  if (ids is! List) {
    return const BranchAvailabilityState(mode: branchAvailabilityModeSelected);
  }
  return BranchAvailabilityState(
    mode: branchAvailabilityModeSelected,
    selectedLocationIds: ids.map((e) => e.toString()).where((e) => e.isNotEmpty).toList(),
  );
}

List<String> normalizeBranchLocationIds(List<String> locationIds) {
  final set = <String>{};
  for (final id in locationIds) {
    final trimmed = id.trim();
    if (trimmed.isNotEmpty) set.add(trimmed);
  }
  final list = set.toList()..sort();
  return list;
}

Map<String, dynamic> branchAvailabilityToDto(BranchAvailabilityState state) {
  if (state.mode == branchAvailabilityModeAll) {
    return {'mode': branchAvailabilityModeAll, 'locationIds': <String>[]};
  }
  return {
    'mode': branchAvailabilityModeSelected,
    'locationIds': normalizeBranchLocationIds(state.selectedLocationIds),
  };
}

List<String> missingBranchLocationIds(
  BranchAvailabilityState state,
  List<String> knownLocationIds,
) {
  if (state.mode != branchAvailabilityModeSelected) return const [];
  final known = knownLocationIds.toSet();
  return state.selectedLocationIds.where((id) => !known.contains(id)).toList();
}

List<String> knownSelectedLocationIds(
  BranchAvailabilityState state,
  List<String> knownLocationIds,
) {
  final known = knownLocationIds.toSet();
  return state.selectedLocationIds.where(known.contains).toList();
}

enum BranchAvailabilityValidationReason {
  ok,
  noBranches,
  selectAtLeastOne,
  missingUnresolved,
}

BranchAvailabilityValidationReason validateBranchAvailabilitySubmit(
  BranchAvailabilityState state,
  List<String> knownLocationIds,
) {
  if (state.mode == branchAvailabilityModeAll) {
    return BranchAvailabilityValidationReason.ok;
  }
  if (knownLocationIds.isEmpty) {
    return BranchAvailabilityValidationReason.noBranches;
  }
  if (missingBranchLocationIds(state, knownLocationIds).isNotEmpty) {
    return BranchAvailabilityValidationReason.missingUnresolved;
  }
  if (knownSelectedLocationIds(state, knownLocationIds).isEmpty) {
    return BranchAvailabilityValidationReason.selectAtLeastOne;
  }
  return BranchAvailabilityValidationReason.ok;
}

bool branchAvailabilityChanged(
  Map<String, dynamic> initial,
  Map<String, dynamic> next,
) {
  if (initial['mode'] != next['mode']) return true;
  if (next['mode'] == branchAvailabilityModeAll) return false;
  final a = [...(initial['locationIds'] as List? ?? []).map((e) => e.toString())]..sort();
  final b = [...(next['locationIds'] as List? ?? []).map((e) => e.toString())]..sort();
  if (a.length != b.length) return true;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return true;
  }
  return false;
}

BranchAvailabilityState setBranchAvailabilityMode(
  BranchAvailabilityState state,
  String mode,
) {
  if (mode == branchAvailabilityModeAll) {
    return const BranchAvailabilityState();
  }
  if (state.mode == branchAvailabilityModeSelected &&
      state.selectedLocationIds.isNotEmpty) {
    return BranchAvailabilityState(
      mode: branchAvailabilityModeSelected,
      selectedLocationIds: [...state.selectedLocationIds],
    );
  }
  return const BranchAvailabilityState(mode: branchAvailabilityModeSelected);
}

BranchAvailabilityState toggleBranchLocationSelection(
  BranchAvailabilityState state,
  String locationId,
  bool checked,
) {
  final set = state.selectedLocationIds.toSet();
  if (checked) {
    set.add(locationId);
  } else {
    set.remove(locationId);
  }
  return BranchAvailabilityState(
    mode: branchAvailabilityModeSelected,
    selectedLocationIds: normalizeBranchLocationIds(set.toList()),
  );
}

Map<String, dynamic> buildMenuItemMutationPayload({
  required Map<String, dynamic> fields,
  required bool isCreate,
  Map<String, dynamic>? initialBranchDto,
  BranchAvailabilityState? branchState,
}) {
  final payload = Map<String, dynamic>.from(fields);
  if (branchState == null) return payload;
  final nextDto = branchAvailabilityToDto(branchState);
  if (isCreate) {
    payload['branchAvailability'] = nextDto;
    return payload;
  }
  final initial = initialBranchDto ?? branchAvailabilityToDto(const BranchAvailabilityState());
  if (branchAvailabilityChanged(initial, nextDto)) {
    payload['branchAvailability'] = nextDto;
  }
  return payload;
}

Map<String, dynamic> buildPromotionMutationPayload({
  required Map<String, dynamic> fields,
  required bool isCreate,
  Map<String, dynamic>? initialBranchDto,
  BranchAvailabilityState? branchState,
}) {
  return buildMenuItemMutationPayload(
    fields: fields,
    isCreate: isCreate,
    initialBranchDto: initialBranchDto,
    branchState: branchState,
  );
}
