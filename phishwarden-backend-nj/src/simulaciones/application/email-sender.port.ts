export const EMAIL_SENDER_PORT = 'EMAIL_SENDER_PORT';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface EmailSenderPort {
  sendEmail(input: SendEmailInput): Promise<{ messageId: string }>;
}
