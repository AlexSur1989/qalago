import '../../features/notifications/data/notification_model.dart';

const _allowedDataKeys = {
  'notificationId',
  'type',
  'targetType',
  'targetId',
  'businessId',
};

/// Converts whitelisted FCM data into [AppNotification] for E.4 navigation.
AppNotification? appNotificationFromPushData(Map<String, dynamic> raw) {
  final data = <String, String>{};
  raw.forEach((key, value) {
    if (value is String && _allowedDataKeys.contains(key)) {
      data[key] = value;
    }
  });

  final notificationId = data['notificationId'];
  final type = data['type'];
  if (notificationId == null || notificationId.isEmpty || type == null || type.isEmpty) {
    return null;
  }

  final businessId = data['businessId'];
  final payload = businessId != null && businessId.isNotEmpty
      ? <String, dynamic>{'businessId': businessId}
      : null;

  return AppNotification(
    id: notificationId,
    type: type,
    title: '',
    body: null,
    isRead: false,
    createdAt: null,
    targetType: data['targetType'],
    targetId: data['targetId'],
    payload: payload,
  );
}

bool pushDataContainsUnsafeRoute(Map<String, dynamic> raw) {
  for (final key in raw.keys) {
    if (key == 'route' || key == 'url' || key == 'deeplink' || key == 'link') {
      return true;
    }
  }
  return false;
}
