import * as nodemailer from 'nodemailer';
import IEmail from '../interfaces/Email';

// import { LogService } from '@infralabs/infra-logger';


export class EmailService {
    constructor() {}

    private static transporter = nodemailer.createTransport({
        host: String(process.env.SMTP_HOST) || '',
        port: parseInt(process.env.SMTP_PORT) || 465,
        auth: {
            user: String(process.env.SMTP_USER) || '',
            pass: String(process.env.SMTP_PASSWORD) || ''
        }
    });

    // public static async send(data: IEmail, logger: LogService) {
    public static async send(data: IEmail) {
        try {
            const {
                to,
                subject,
                body,
                attachments,
                from = process.env.SMTP_FROM || '',
                replyTo = process.env.SMTP_REPLYTO || ''
            } = data;

            const info = await this.transporter.sendMail({
                from, to, subject, attachments, replyTo,
                text: body.text,
                html: body.html
            });

            if (!info.messageId) {
                throw new Error('Email not sent');
            }
            // logger.add('ifc.freight.api.orders.emailService.send', `Email sent to ${to}: ${info.messageId}`);
            console.log('ifc.freight.api.orders.emailService.send', `Email sent to ${to}: ${info.messageId}`);

            return info.messageId;
        } catch (error) {
            // logger.error(error);
            console.log('ifc.freight.api.orders.emailService.send.error', error);
        }
    }
}
