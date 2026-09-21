export type PushDeliveryFailureKind = 'permanent_invalid_token' | 'temporary' | 'disabled';

export type PushTokenDeliveryResult = {
  deviceId: string;
  success: boolean;
  failureKind?: PushDeliveryFailureKind;
};

export type PushNotificationDeliveryResult = {
  notificationId: string;
  attempted: number;
  succeeded: number;
  results: PushTokenDeliveryResult[];
};
