import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  PushDeliveryGateway,
  PushDeliveryTarget,
} from './push-delivery-gateway.interface';
import { PushDisplayCopy } from './notification-push-copy';
import { PushTokenDeliveryResult } from './push-delivery-result';
import { assertPushDataPayloadSafe } from './push-payload';

function maskToken(token: string): string {
  if (token.length <= 12) return '***';
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

function isPermanentFcmError(code: string | undefined): boolean {
  if (!code) return false;
  return (
    code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-registration-token' ||
    code === 'messaging/invalid-argument'
  );
}

@Injectable()
export class FirebasePushDeliveryGateway implements PushDeliveryGateway, OnModuleInit {
  private readonly logger = new Logger(FirebasePushDeliveryGateway.name);
  private messaging: admin.messaging.Messaging | null = null;

  private configured = false;

  get isEnabled(): boolean {
    return this.configured && this.messaging != null;
  }

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    if (this.config.get<boolean>('push.enabled') !== true) return;

    const projectId = this.config.get<string>('push.firebaseProjectId') ?? '';
    const clientEmail = this.config.get<string>('push.firebaseClientEmail') ?? '';
    const privateKeyRaw = this.config.get<string>('push.firebasePrivateKey') ?? '';

    if (!projectId || !clientEmail || !privateKeyRaw) {
      this.logger.warn('PUSH_ENABLED=true but Firebase credentials are incomplete — push disabled');
      return;
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      this.messaging = admin.messaging();
      this.configured = true;
      this.logger.log('Firebase Admin initialized for push delivery');
    } catch (error) {
      this.logger.error(
        `Firebase Admin init failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      this.messaging = null;
    }
  }

  async sendToToken(
    target: PushDeliveryTarget,
    message: PushDisplayCopy,
  ): Promise<PushTokenDeliveryResult> {
    if (!this.messaging) {
      return {
        deviceId: target.deviceId,
        success: false,
        failureKind: 'disabled',
      };
    }

    assertPushDataPayloadSafe(message.data);

    try {
      await this.messaging.send({
        token: target.token,
        notification: {
          title: message.title,
          body: message.body,
        },
        data: message.data,
        android: { priority: 'high' },
        apns: {
          payload: { aps: { sound: 'default' } },
        },
      });
      return { deviceId: target.deviceId, success: true };
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: string }).code)
          : undefined;
      this.logger.warn(
        `FCM send failed for device ${target.deviceId} token ${maskToken(target.token)}: ${code ?? 'unknown'}`,
      );
      if (isPermanentFcmError(code)) {
        return {
          deviceId: target.deviceId,
          success: false,
          failureKind: 'permanent_invalid_token',
        };
      }
      return {
        deviceId: target.deviceId,
        success: false,
        failureKind: 'temporary',
      };
    }
  }
}
