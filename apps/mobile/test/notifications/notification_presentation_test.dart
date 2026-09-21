import 'package:flutter_test/flutter_test.dart';
import 'package:qalago_mobile/features/notifications/data/notification_model.dart';
import 'package:qalago_mobile/features/notifications/presentation/notification_presentation.dart';
import 'package:qalago_mobile/l10n/app_localizations_kk.dart';
import 'package:qalago_mobile/l10n/app_localizations_ru.dart';

AppNotification _n({
  required String type,
  String title = 'Legacy title',
  String? body = 'Legacy body',
  Map<String, dynamic>? payload,
}) {
  return AppNotification(
    id: 'n1',
    type: type,
    title: title,
    body: body,
    isRead: false,
    createdAt: DateTime.utc(2026, 9, 20, 12),
    payload: payload,
  );
}

void main() {
  final ru = AppLocalizationsRu();
  final kk = AppLocalizationsKk();

  group('known types RU/KK', () {
    test('NEW_REVIEW', () {
      expect(
        presentAppNotification(ru, _n(type: 'NEW_REVIEW')).title,
        ru.notificationNewReviewTitle,
      );
      expect(
        presentAppNotification(kk, _n(type: 'NEW_REVIEW')).title,
        kk.notificationNewReviewTitle,
      );
    });

    test('REVIEW_REPLY', () {
      expect(
        presentAppNotification(ru, _n(type: 'REVIEW_REPLY')).title,
        ru.notificationReviewReplyTitle,
      );
      expect(
        presentAppNotification(kk, _n(type: 'REVIEW_REPLY')).title,
        kk.notificationReviewReplyTitle,
      );
    });

    test('REVIEW_HIDDEN and RESTORED', () {
      expect(
        presentAppNotification(ru, _n(type: 'REVIEW_HIDDEN')).title,
        ru.notificationReviewHiddenTitle,
      );
      expect(
        presentAppNotification(kk, _n(type: 'REVIEW_RESTORED')).title,
        kk.notificationReviewRestoredTitle,
      );
    });

    test('business application approve/reject', () {
      expect(
        presentAppNotification(ru, _n(type: 'BUSINESS_APPLICATION_APPROVED')).title,
        ru.notificationBusinessApplicationApprovedTitle,
      );
      expect(
        presentAppNotification(kk, _n(type: 'BUSINESS_APPLICATION_REJECTED')).title,
        kk.notificationBusinessApplicationRejectedTitle,
      );
    });

    test('ownership claim approve/reject', () {
      expect(
        presentAppNotification(ru, _n(type: 'OWNERSHIP_CLAIM_APPROVED')).title,
        ru.notificationOwnershipClaimApprovedTitle,
      );
      expect(
        presentAppNotification(kk, _n(type: 'OWNERSHIP_CLAIM_REJECTED')).title,
        kk.notificationOwnershipClaimRejectedTitle,
      );
    });

    test('invitation received/accepted', () {
      expect(
        presentAppNotification(ru, _n(type: 'BUSINESS_INVITATION_RECEIVED')).title,
        ru.notificationInvitationReceivedTitle,
      );
      expect(
        presentAppNotification(kk, _n(type: 'BUSINESS_INVITATION_ACCEPTED')).title,
        kk.notificationInvitationAcceptedTitle,
      );
    });

    test('plan activated/expired', () {
      final withTier = _n(
        type: 'PLAN_ACTIVATED',
        payload: {'tier': 'PRO'},
      );
      expect(
        presentAppNotification(ru, withTier).body,
        isNot(contains('Legacy')),
      );
      expect(
        presentAppNotification(kk, _n(type: 'PLAN_EXPIRED')).title,
        kk.notificationPlanExpiredTitle,
      );
    });

    test('ad campaign approved/rejected', () {
      expect(
        presentAppNotification(ru, _n(type: 'AD_CAMPAIGN_APPROVED')).title,
        ru.notificationAdCampaignApprovedTitle,
      );
      expect(
        presentAppNotification(kk, _n(type: 'AD_CAMPAIGN_REJECTED')).title,
        kk.notificationAdCampaignRejectedTitle,
      );
    });
  });

  test('GENERAL uses legacy title/body', () {
    final p = presentAppNotification(
      ru,
      _n(type: 'GENERAL', title: 'Системное', body: 'Текст'),
    );
    expect(p.title, 'Системное');
    expect(p.body, 'Текст');
    expect(p.usedLegacyFallback, isTrue);
  });

  test('unknown type uses legacy fallback', () {
    final p = presentAppNotification(
      ru,
      _n(type: 'FUTURE_EVENT', title: 'Custom', body: null),
    );
    expect(p.title, 'Custom');
    expect(p.body, isNull);
    expect(p.usedLegacyFallback, isTrue);
  });

  test('known type without payload uses generic template', () {
    final p = presentAppNotification(ru, _n(type: 'NEW_REVIEW', title: 'RU backend'));
    expect(p.title, ru.notificationNewReviewTitle);
    expect(p.body, ru.notificationNewReviewBody);
    expect(p.usedLegacyFallback, isFalse);
  });

  test('historical row null target/payload', () {
    const historical = AppNotification(
      id: 'old',
      type: 'BUSINESS_APPROVED',
      title: 'Старое RU',
      body: 'body',
      isRead: true,
      createdAt: null,
      targetType: null,
      targetId: null,
      payload: null,
    );
    final p = presentAppNotification(ru, historical);
    expect(p.title, ru.notificationBusinessApprovedTitle);
    expect(p.usedLegacyFallback, isFalse);
  });

  test('businessName in payload is not translated', () {
    final p = presentAppNotification(
      ru,
      _n(
        type: 'NEW_REVIEW',
        payload: {'businessName': 'Cafe Qala'},
      ),
    );
    expect(p.body, contains('Cafe Qala'));
  });
}
