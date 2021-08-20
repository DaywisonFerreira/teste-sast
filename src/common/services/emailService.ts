import * as nodemailer from 'nodemailer';
import IEmail from '../interfaces/Email';

import { LogService } from '@infralabs/infra-logger';


export class EmailService {
   constructor(){}

    private static transporter = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: '20f5cf1277f027',
            pass: 'ca5cac0816b044',
        },
    })

    public static async send(data: IEmail){
        const logger = new LogService();
        try {
            logger.startAt();
            const { from, to, subject, body, attachments } = data;

            const info = await this.transporter.sendMail({
                from, to, subject, attachments,
                text: body.text,
                html: body.html
            })

            if(!info.messageId){
                throw new Error('Email not sent')
            }
            logger.add(`Email sent to ${to}`, info.messageId);
            logger.endAt();
            await logger.sendLog();
            return info.messageId
        } catch (error) {
            logger.error(error);
            logger.endAt();
            await logger.sendLog();
        }
    }
}
