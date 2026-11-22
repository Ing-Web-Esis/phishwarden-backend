import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type {
  PushNotificationPort,
  PushNotificationPayload,
} from '../application/push-notification.port';
import { MOBILE_REPOSITORY_PORT } from '../application/mobile.repository.port';
import type { MobileRepositoryPort } from '../application/mobile.repository.port';

@Injectable()
export class FcmPushService implements PushNotificationPort, OnModuleInit {
  private readonly logger = new Logger(FcmPushService.name);
  private isLiveMode = false;

  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  onModuleInit() {
    const fcmMode = (process.env.FCM_MODE || 'sandbox').toLowerCase().trim();
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (fcmMode === 'live') {
      if (!projectId || !clientEmail || !privateKeyRaw) {
        this.logger.warn(
          '[FCM] Modo LIVE configurado pero faltan credenciales de Firebase. Operando en modo SANDBOX defensivo.',
        );
        this.isLiveMode = false;
        return;
      }

      try {
        if (getApps().length === 0) {
          const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
          initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        }
        this.isLiveMode = true;
        this.logger.log('[FCM] Firebase Admin SDK inicializado en modo LIVE.');
      } catch (error) {
        this.logger.error('[FCM] Error inicializando Firebase Admin SDK:', error);
        this.isLiveMode = false;
      }
    } else {
      this.isLiveMode = false;
      this.logger.log('[FCM] Servicio Push inicializado en modo SANDBOX (Simulación activa).');
    }
  }

  async sendPush(payload: PushNotificationPayload): Promise<boolean> {
    if (!payload.token || payload.token.trim() === '') {
      return false;
    }

    // Normalizar objeto data para asegurar que todos los valores sean estrictamente string
    const stringData: Record<string, string> = {};
    if (payload.data) {
      for (const [key, val] of Object.entries(payload.data)) {
        stringData[key] = typeof val === 'string' ? val : String(val);
      }
    }

    if (!this.isLiveMode) {
      this.logger.log(
        `[FCM_SANDBOX] Notificación Push simulada:
         Token: ${payload.token.substring(0, 16)}...
         Título: "${payload.title}"
         Mensaje: "${payload.body}"
         Data: ${JSON.stringify(stringData)}`,
      );
      return true;
    }

    try {
      await getMessaging().send({
        token: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: stringData,
      });

      this.logger.log(
        `[FCM_LIVE] Notificación Push enviada exitosamente a ${payload.token.substring(0, 16)}... ("${payload.title}")`,
      );
      return true;
    } catch (error: any) {
      this.logger.error(
        `[FCM_LIVE] Error al enviar notificación push a ${payload.token.substring(0, 16)}...:`,
        error?.message || error,
      );

      // Auto-limpieza de tokens inválidos o no registrados
      const errorCode = error?.code || error?.errorInfo?.code;
      if (
        errorCode === 'messaging/invalid-registration-token' ||
        errorCode === 'messaging/registration-token-not-registered'
      ) {
        try {
          await this.mobileRepository.clearInvalidPushToken(payload.token);
          this.logger.warn(
            `[FCM_LIVE] Token inválido desvinculado automáticamente de la base de datos: ${payload.token.substring(0, 16)}...`,
          );
        } catch (cleanupError) {
          this.logger.error(
            '[FCM_LIVE] Error al limpiar token inválido de la base de datos:',
            cleanupError,
          );
        }
      }

      return false;
    }
  }
}
