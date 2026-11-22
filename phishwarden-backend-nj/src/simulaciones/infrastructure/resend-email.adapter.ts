import { Injectable, Logger } from '@nestjs/common';
import type {
  EmailSenderPort,
  SendEmailInput,
} from '../application/email-sender.port';
import { Resend } from 'resend';

@Injectable()
export class ResendEmailAdapter implements EmailSenderPort {
  private readonly logger = new Logger(ResendEmailAdapter.name);
  private resendClient: Resend | null = null;

  private getClient(): Resend {
    if (!this.resendClient) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error(
          'RESEND_API_KEY no está configurada en las variables de entorno.',
        );
      }
      this.resendClient = new Resend(apiKey);
    }
    return this.resendClient;
  }

  async sendEmail(input: SendEmailInput): Promise<{ messageId: string }> {
    const dispatchMode = (process.env.DISPATCH_MODE || 'sandbox').toLowerCase();

    if (dispatchMode !== 'live') {
      this.logger.log(
        `[SANDBOX EMAIL DISPATCH] Destinatario: ${input.to} | Asunto: "${input.subject}" | Longitud HTML: ${input.html.length} caracteres`,
      );
      return {
        messageId: `sandbox-email-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}`,
      };
    }

    const client = this.getClient();
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'simulaciones@phishwarden.com';

    const response = await client.emails.send({
      from: fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (response.error) {
      throw new Error(`Error de API Resend: ${response.error.message}`);
    }

    return { messageId: response.data?.id || 'live-resend-sent' };
  }
}
