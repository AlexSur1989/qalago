import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import 'team_models.dart';

final ownerTeamSnapshotProvider =
    FutureProvider.family<OwnerTeamSnapshot, String>((ref, businessId) async {
  final catalog = ref.watch(catalogRepositoryProvider);
  final results = await Future.wait([
    catalog.fetchTeam(businessId),
    catalog.fetchBusinessPlan(businessId),
  ]);
  final team = TeamListModel.fromJson(results[0] as Map<String, dynamic>);
  final plan = results[1] as Map<String, dynamic>;
  final catalogMeta = plan['catalog'] as Map<String, dynamic>? ?? const {};
  return OwnerTeamSnapshot(
    team: team,
    usage: TeamPlanUsage.fromPlanJson(plan),
    planNameRu: catalogMeta['nameRu'] as String? ?? '',
  );
});
