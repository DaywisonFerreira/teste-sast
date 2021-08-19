import * as nodemailer from 'nodemailer';

import { logger } from 'ihub-framework-ts';
import IEmail from '../interfaces/Email';

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
        try {
            const { from, to, subject, body, attachments } = data;

            const info = await this.transporter.sendMail({
                from, to, subject, attachments,
                text: body.text,
                html: body.html
            })

            if(!info.messageId){
                throw new Error('Email not sent')
            }
            return info.messageId
        } catch (error) {
            logger.error(error.message, 'ifc.freight.api.orders.emailService.send', { stack: error.stack });
        }
    }
}
