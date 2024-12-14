import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
    SendGrid.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  async send(options: EmailOptions) {
    try {
      const msg = {
        to: options.to,
        from: this.configService.get<string>('SENDGRID_FROM_EMAIL'),
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await SendGrid.send(msg);
    } catch (error) {
      console.error('SendGrid error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    await this.send({
      to: email,
      subject: 'Welcome to Our Platform!',
      html: `<p>Welcome, ${firstName}! We're glad to have you onboard.</p>`,
      text: `Welcome, ${firstName}! We're glad to have you onboard.`,
    });
  }

  async sendEnrollmentConfirmation(email: string) {
    await this.send({
      to: email,
      subject: 'Course Enrollment Confirmation',
      html: `<p>You've successfully enrolled in a course.</p>`,
      text: `You've successfully enrolled in a course.`,
    });
  }

  async sendPaymentConfirmation(email: string) {
    await this.send({
      to: email,
      subject: 'Payment Confirmation',
      html: `<p>You've successfully Purchased course.</p>`,
      text: `You've successfully Purchased course.`,
    });
  }
}
