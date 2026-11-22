export const PUSH_NOTIFICATION_PORT = 'PUSH_NOTIFICATION_PORT';

export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushNotificationPort {
  sendPush(payload: PushNotificationPayload): Promise<boolean>;
}
