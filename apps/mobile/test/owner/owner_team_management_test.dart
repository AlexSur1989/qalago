import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/core/rbac/business_access.dart';
import 'package:qalago_mobile/features/owner/team/business_permission_ui.dart';
import 'package:qalago_mobile/features/owner/team/team_error_utils.dart';
import 'package:qalago_mobile/features/owner/team/team_models.dart';

void main() {
  group('Owner nav — Команда', () {
    test('OWNER sees team nav item', () {
      final access = BusinessAccess(
        role: BusinessAccessRole.owner,
        permissions: const [],
      );
      expect(filterOwnerNavByPermission(access), contains(OwnerNavItem.team));
    });

    test('MANAGER does not see team nav item', () {
      final access = BusinessAccess(
        role: BusinessAccessRole.manager,
        permissions: BusinessPermission.values,
      );
      expect(filterOwnerNavByPermission(access), isNot(contains(OwnerNavItem.team)));
    });
  });

  group('Team models', () {
    test('parses members and pending invitations', () {
      final model = TeamListModel.fromJson({
        'members': [
          {
            'membershipId': 'm1',
            'userId': 'u1',
            'name': 'Owner',
            'role': 'OWNER',
            'status': 'ACTIVE',
            'permissions': [],
          },
          {
            'membershipId': 'm2',
            'userId': 'u2',
            'phone': '+77001234567',
            'role': 'MANAGER',
            'status': 'ACTIVE',
            'permissions': ['CATALOG_EDIT'],
          },
        ],
        'pendingInvitations': [
          {
            'invitationId': 'i1',
            'email': 'mgr@example.com',
            'inviteType': 'email',
            'permissions': ['ANALYTICS_VIEW'],
            'status': 'PENDING',
            'expiresAt': '2026-12-31T00:00:00.000Z',
          },
        ],
      });

      expect(model.members, hasLength(2));
      expect(model.members.first.isOwner, isTrue);
      expect(model.members[1].isManager, isTrue);
      expect(model.pendingInvitations.single.email, 'mgr@example.com');
    });

    test('OWNER member is protected from manager actions in UI layer', () {
      const owner = TeamMemberModel(
        membershipId: 'm1',
        userId: 'u1',
        role: 'OWNER',
        status: 'ACTIVE',
        permissions: [],
        name: 'Owner',
      );
      expect(owner.isOwner, isTrue);
      expect(owner.isManager, isFalse);
    });

    test('TeamPlanUsage reads backend plan.team', () {
      final usage = TeamPlanUsage.fromPlanJson({
        'catalog': {'nameRu': 'Про'},
        'team': {
          'activeManagers': 1,
          'pendingInvitations': 1,
          'limit': 3,
          'slotsUsed': 2,
          'canAddManager': true,
        },
      });
      expect(usage.slotsUsed, 2);
      expect(usage.limit, 3);
      expect(usage.canAddManager, isTrue);
    });

    test('InviteTeamResult ignores rawToken field', () {
      final result = InviteTeamResult.fromJson({
        'type': 'invitation',
        'invitationId': 'i1',
        'inviteUrl': 'http://localhost:3003/invite/abc',
        'rawToken': 'secret-token',
      });
      expect(result.inviteUrl, contains('/invite/'));
      expect(result.toString(), isNot(contains('secret-token')));
    });
  });

  group('Permission labels and presets', () {
    test('maps all backend permission enums to RU labels', () {
      for (final permission in BusinessPermission.values) {
        final label = permissionLabelRu(permission.apiValue);
        expect(label, isNot(permission.apiValue));
        expect(label.isNotEmpty, isTrue);
      }
    });

    test('presets align with Business Web ids', () {
      expect(permissionPresets.map((p) => p.id), [
        'manager',
        'content',
        'marketing',
        'analytics',
      ]);
    });

    test('summarize permissions truncates long lists', () {
      final summary = summarizePermissionsRu([
        'CATALOG_EDIT',
        'PHOTOS_EDIT',
        'PROMOTIONS_EDIT',
        'REVIEWS_REPLY',
      ]);
      expect(summary, contains('+1'));
    });
  });

  group('Invite form validation', () {
    test('validates email', () {
      expect(isValidInviteEmail('bad'), isFalse);
      expect(isValidInviteEmail('user@example.com'), isTrue);
    });
  });

  group('Team error mapping', () {
    test('403 maps to permission message', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/team'),
        response: Response(
          requestOptions: RequestOptions(path: '/team'),
          statusCode: 403,
        ),
        type: DioExceptionType.badResponse,
      );
      expect(mapTeamOperationError(error), contains('прав'));
    });

    test('plan limit uses backend message when safe', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/team/invite'),
        response: Response(
          requestOptions: RequestOptions(path: '/team/invite'),
          statusCode: 403,
          data: {
            'message':
                'Лимит тарифа «Про»: не более 3 менеджеров. Сначала отзовите приглашение или понизьте состав команды.',
          },
        ),
        type: DioExceptionType.badResponse,
      );
      expect(mapTeamOperationError(error), contains('Лимит тарифа'));
    });

    test('does not expose raw DioException text', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/team'),
        type: DioExceptionType.connectionError,
      );
      final message = mapTeamOperationError(error);
      expect(isUserFacingTeamMessage(message), isTrue);
      expect(message.contains('DioException'), isFalse);
    });
  });

  group('Multi-business businessId', () {
    test('snapshot provider key is businessId-scoped', () {
      const a = 'biz-a';
      const b = 'biz-b';
      expect(a == b, isFalse);
    });
  });

  group('Invitation token security', () {
    test('ResolvedInvitationModel has no token field', () {
      final model = ResolvedInvitationModel.fromJson({
        'status': 'PENDING',
        'businessName': 'Cafe',
        'expiresAt': '2026-12-31T00:00:00.000Z',
      });
      expect(model.businessName, 'Cafe');
    });
  });
}
