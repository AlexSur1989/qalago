/// Team list DTOs — mirrors catalog-api team list response (Stage 6.5.2).
library;

class TeamMemberModel {
  const TeamMemberModel({
    required this.membershipId,
    required this.userId,
    required this.role,
    required this.status,
    required this.permissions,
    this.name,
    this.phone,
    this.createdAt,
  });

  final String membershipId;
  final String userId;
  final String? name;
  final String? phone;
  final String role;
  final String status;
  final List<String> permissions;
  final DateTime? createdAt;

  bool get isOwner => role == 'OWNER';
  bool get isManager => role == 'MANAGER';
  bool get isActive => status == 'ACTIVE';
  bool get isSuspended => status == 'SUSPENDED';

  factory TeamMemberModel.fromJson(Map<String, dynamic> json) {
    return TeamMemberModel(
      membershipId: json['membershipId'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String?,
      phone: json['phone'] as String?,
      role: json['role'] as String? ?? 'MANAGER',
      status: json['status'] as String? ?? 'ACTIVE',
      permissions: (json['permissions'] as List<dynamic>? ?? const [])
          .map((e) => e as String)
          .toList(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}

class TeamInvitationModel {
  const TeamInvitationModel({
    required this.invitationId,
    required this.permissions,
    required this.status,
    required this.expiresAt,
    this.phone,
    this.email,
    this.inviteType,
    this.createdAt,
  });

  final String invitationId;
  final String? phone;
  final String? email;
  final String? inviteType;
  final List<String> permissions;
  final String status;
  final DateTime expiresAt;
  final DateTime? createdAt;

  String get recipientLabel => email ?? phone ?? '—';

  factory TeamInvitationModel.fromJson(Map<String, dynamic> json) {
    return TeamInvitationModel(
      invitationId: json['invitationId'] as String,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      inviteType: json['inviteType'] as String?,
      permissions: (json['permissions'] as List<dynamic>? ?? const [])
          .map((e) => e as String)
          .toList(),
      status: json['status'] as String? ?? 'PENDING',
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}

class TeamListModel {
  const TeamListModel({
    required this.members,
    required this.pendingInvitations,
  });

  final List<TeamMemberModel> members;
  final List<TeamInvitationModel> pendingInvitations;

  factory TeamListModel.fromJson(Map<String, dynamic> json) {
    return TeamListModel(
      members: (json['members'] as List<dynamic>? ?? const [])
          .map((e) => TeamMemberModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      pendingInvitations:
          (json['pendingInvitations'] as List<dynamic>? ?? const [])
              .map((e) => TeamInvitationModel.fromJson(e as Map<String, dynamic>))
              .toList(),
    );
  }
}

class TeamPlanUsage {
  const TeamPlanUsage({
    required this.activeManagers,
    required this.pendingInvitations,
    required this.limit,
    required this.slotsUsed,
    required this.canAddManager,
  });

  final int activeManagers;
  final int pendingInvitations;
  final int limit;
  final int slotsUsed;
  final bool canAddManager;

  factory TeamPlanUsage.fromPlanJson(Map<String, dynamic> plan) {
    final team = plan['team'] as Map<String, dynamic>? ?? const {};
    return TeamPlanUsage(
      activeManagers: (team['activeManagers'] as num?)?.toInt() ?? 0,
      pendingInvitations: (team['pendingInvitations'] as num?)?.toInt() ?? 0,
      limit: (team['limit'] as num?)?.toInt() ?? 0,
      slotsUsed: (team['slotsUsed'] as num?)?.toInt() ?? 0,
      canAddManager: team['canAddManager'] as bool? ?? false,
    );
  }
}

class OwnerTeamSnapshot {
  const OwnerTeamSnapshot({
    required this.team,
    required this.usage,
    required this.planNameRu,
  });

  final TeamListModel team;
  final TeamPlanUsage usage;
  final String planNameRu;
}

/// Invite API result — [rawToken] from API is never stored or logged.
class InviteTeamResult {
  const InviteTeamResult({
    required this.type,
    this.membershipId,
    this.invitationId,
    this.inviteUrl,
    this.expiresAt,
  });

  final String type;
  final String? membershipId;
  final String? invitationId;
  final String? inviteUrl;
  final DateTime? expiresAt;

  bool get isInvitation => type == 'invitation';

  factory InviteTeamResult.fromJson(Map<String, dynamic> json) {
    return InviteTeamResult(
      type: json['type'] as String? ?? 'invitation',
      membershipId: json['membershipId'] as String?,
      invitationId: json['invitationId'] as String?,
      inviteUrl: json['inviteUrl'] as String?,
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'] as String)
          : null,
    );
  }
}

class ResolvedInvitationModel {
  const ResolvedInvitationModel({
    required this.status,
    required this.businessName,
    required this.expiresAt,
    this.recipientEmailMasked,
  });

  final String status;
  final String businessName;
  final String? recipientEmailMasked;
  final DateTime expiresAt;

  factory ResolvedInvitationModel.fromJson(Map<String, dynamic> json) {
    return ResolvedInvitationModel(
      status: json['status'] as String? ?? 'PENDING',
      businessName: json['businessName'] as String? ?? '',
      recipientEmailMasked: json['recipientEmailMasked'] as String?,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );
  }
}

class AcceptInvitationResult {
  const AcceptInvitationResult({
    required this.businessId,
    required this.membershipId,
    this.alreadyMember,
    this.alreadyAccepted,
  });

  final String businessId;
  final String membershipId;
  final bool? alreadyMember;
  final bool? alreadyAccepted;

  factory AcceptInvitationResult.fromJson(Map<String, dynamic> json) {
    return AcceptInvitationResult(
      businessId: json['businessId'] as String,
      membershipId: json['membershipId'] as String,
      alreadyMember: json['alreadyMember'] as bool?,
      alreadyAccepted: json['alreadyAccepted'] as bool?,
    );
  }
}
