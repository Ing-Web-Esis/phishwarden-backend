import { Injectable, Logger } from '@nestjs/common';
import type {
  SmsSenderPort,
  SendSmsInput,
} from '../application/sms-sender.port';
import twilio from 'twilio';

@Injectable()
export class TwilioSmsAdapter implements SmsSenderPort {
  private readonly logger = new Logger(TwilioSmsAdapter.name);
  private twilioClient: any = null;

  private getClient(): any {
    if (!this.twilioClient) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!accountSid || !authToken) {
        throw new Error(
          'TWILIO_ACCOUNT_SID o TWILIO_AUTH_TOKEN no configuradas en variables de entorno.',
        );
      }
      this.twilioClient = twilio(accountSid, authToken);
    }
    return this.twilioClient;
  }

  async sendSms(input: SendSmsInput): Promise<{ messageSid: string }> {
    const dispatchMode = (process.env.DISPATCH_MODE || 'sandbox').toLowerCase();

    if (dispatchMode !== 'live') {
      this.logger.log(
        `[SANDBOX SMS DISPATCH] Teléfono: ${input.to} | Mensaje: "${input.body}"`,
      );
      return {
        messageSid: `sandbox-sms-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}`,
      };
    }

    const client = this.getClient();
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    if (!fromPhone) {
      throw new Error(
        'TWILIO_PHONE_NUMBER no configurada en variables de entorno.',
      );
    }

    const message = await client.messages.create({
      body: input.body,
      from: fromPhone,
      to: input.to,
    });

    return { messageSid: message.sid };
  }
}
