import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('SMTP_HOST'),
            port: Number(this.configService.get('SMTP_PORT')),
            secure: false,
            auth: {
                user: this.configService.get('SMTP_USER'),
                pass: this.configService.get('SMTP_PASS'),
            },
        });
    }

    async sendOTP(code: string) {
        const to = this.configService.get('OTP_EMAIL');

        await this.transporter.sendMail({
            from: `"АЗС Система" <${this.configService.get('SMTP_USER')}>`,
            to,
            subject: 'Код входа',
            html: `
        <div style="font-family: Arial; text-align: center; padding: 20px;">
          <h2>Ваш код для входа</h2>
          <div style="font-size: 36px; font-weight: bold; color: #4f46e5; letter-spacing: 8px;">
            ${code}
          </div>
          <p>Действителен 5 минут</p>
        </div>
      `,
        });
    }
}