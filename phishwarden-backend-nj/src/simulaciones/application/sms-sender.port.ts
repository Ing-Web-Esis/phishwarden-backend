export const SMS_SENDER_PORT = 'SMS_SENDER_PORT';

export interface SendSmsInput {
  to: string;
  body: string;
}

export interface SmsSenderPort {
  sendSms(input: SendSmsInput): Promise<{ messageSid: string }>;
}
