import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/city_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../owner_business_location.dart';
import '../../../shared/models/business_branch_location.dart';

final ownerBusinessLocationsProvider =
    FutureProvider.family<List<BusinessBranchLocation>, String>((ref, businessId) async {
  final repo = ref.read(catalogRepositoryProvider);
  final locations = await repo.fetchOwnerBusinessLocations(businessId);
  final cities = await ref.read(citiesProvider.future);
  return enrichOwnerLocationsWithCities(locations, cities);
});
