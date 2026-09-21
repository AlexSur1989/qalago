import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/notifications/data/notification_model.dart';
import 'package:qalago_mobile/features/notifications/navigation/notification_destination.dart';

AppNotification n({
  required String type,
  String? targetType,
  String? targetId,
  Map<String, dynamic>? payload,
}) {
  return AppNotification(
    id: 'n1',
    type: type,
    title: 't',
    body: 'b',
    isRead: false,
    createdAt: null,
    targetType: targetType,
    targetId: targetId,
    payload: payload,
  );
}

void main() {
  test('GENERAL has no destination', () {
    final dest = resolveNotificationDestination(n(type: 'GENERAL'));
    expect(dest, isA<NoNotificationDestination>());
  });

  test('unknown type has no destination', () {
    final dest = resolveNotificationDestination(
      n(type: 'FUTURE_TYPE', targetType: 'BUSINESS', targetId: 'b1'),
    );
    expect(dest, isA<NoNotificationDestination>());
  });

  test('null targetId does not crash', () {
    final dest = resolveNotificationDestination(
      n(type: 'BUSINESS_APPROVED', targetType: 'BUSINESS', targetId: null),
    );
    expect(dest, isA<NoNotificationDestination>());
  });

  test('wrong targetType is unsafe', () {
    final dest = resolveNotificationDestination(
      n(type: 'BUSINESS_APPROVED', targetType: 'REVIEW', targetId: 'r1'),
    );
    expect(dest, isA<NoNotificationDestination>());
  });

  test('malformed payload does not crash', () {
    final dest = resolveNotificationDestination(
      n(
        type: 'NEW_REVIEW',
        targetType: 'REVIEW',
        targetId: 'rev-1',
        payload: {'businessId': 'http://evil'},
      ),
    );
    expect(dest, isA<NoNotificationDestination>());
  });

  test('BUSINESS target maps to business details', () {
    final dest = resolveNotificationDestination(
      n(type: 'BUSINESS_APPROVED', targetType: 'BUSINESS', targetId: 'biz-1'),
    );
    expect(dest, isA<ConsumerBusinessDetailsDestination>());
    expect((dest as ConsumerBusinessDetailsDestination).businessId, 'biz-1');
  });

  test('NEW_REVIEW maps to owner reviews with producer businessId', () {
    final dest = resolveNotificationDestination(
      n(
        type: 'NEW_REVIEW',
        targetType: 'REVIEW',
        targetId: 'rev-1',
        payload: {'businessId': 'biz-1', 'reviewId': 'rev-1'},
      ),
    );
    expect(dest, isA<OwnerReviewsDestination>());
  });

  test('REVIEW_REPLY maps to consumer business reviews', () {
    final dest = resolveNotificationDestination(
      n(
        type: 'REVIEW_REPLY',
        targetType: 'REVIEW',
        targetId: 'rev-1',
        payload: {'businessId': 'biz-1'},
      ),
    );
    expect(dest, isA<ConsumerBusinessReviewsDestination>());
  });

  test('REVIEW_HIDDEN maps to profile reviews', () {
    final dest = resolveNotificationDestination(
      n(type: 'REVIEW_HIDDEN', targetType: 'REVIEW', targetId: 'rev-1'),
    );
    expect(dest, isA<ConsumerProfileReviewsDestination>());
  });

  test('PLAN maps to owner plan with business selection', () {
    final dest = resolveNotificationDestination(
      n(type: 'PLAN_ACTIVATED', targetType: 'BUSINESS', targetId: 'biz-9'),
    );
    expect(dest, isA<OwnerPlanDestination>());
  });

  test('AD_CAMPAIGN maps to campaign detail', () {
    final dest = resolveNotificationDestination(
      n(
        type: 'AD_CAMPAIGN_APPROVED',
        targetType: 'AD_CAMPAIGN',
        targetId: 'camp-1',
      ),
    );
    expect(dest, isA<OwnerMonetizationCampaignDestination>());
  });

  test('BUSINESS_APPLICATION maps to apply flow', () {
    final dest = resolveNotificationDestination(
      n(
        type: 'BUSINESS_APPLICATION_APPROVED',
        targetType: 'BUSINESS_APPLICATION',
        targetId: 'app-1',
      ),
    );
    expect(dest, isA<BusinessApplicationFlowDestination>());
  });

  test('OWNERSHIP_CLAIM maps to claims list', () {
    final dest = resolveNotificationDestination(
      n(
        type: 'OWNERSHIP_CLAIM_REJECTED',
        targetType: 'OWNERSHIP_CLAIM',
        targetId: 'claim-1',
      ),
    );
    expect(dest, isA<BusinessClaimsListDestination>());
  });

  test('invitation maps to owner team', () {
    final dest = resolveNotificationDestination(
      n(
        type: 'BUSINESS_INVITATION_ACCEPTED',
        targetType: 'BUSINESS',
        targetId: 'biz-1',
      ),
    );
    expect(dest, isA<OwnerTeamDestination>());
  });

  test('MODERATION_CASE never navigates', () {
    final dest = resolveNotificationDestination(
      n(
        type: 'REVIEW_HIDDEN',
        targetType: 'MODERATION_CASE',
        targetId: 'case-1',
      ),
    );
    expect(dest, isA<NoNotificationDestination>());
  });

  test('historical row without target stays safe', () {
    final dest = resolveNotificationDestination(
      AppNotification(
        id: 'old',
        type: 'PLAN_ACTIVATED',
        title: 'Legacy',
        body: null,
        isRead: true,
        createdAt: null,
        targetType: null,
        targetId: null,
        payload: null,
      ),
    );
    expect(dest, isA<NoNotificationDestination>());
  });
}
