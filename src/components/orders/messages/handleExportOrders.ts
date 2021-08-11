import { XlsxMapper } from '../mappers/xlsxMapper';
import { EmailService } from '../../../common/services/emailService';
import { FileService } from '../../../common/services/fileService';
import { OrderService } from '../services/orderService';

import { LogService } from '@infralabs/infra-logger';

export default class HandleExportOrders {
    constructor() {}

    async execute(payload: any, done: Function): Promise<void> {
        let file = {
            path:'',
            fileName:''
        }

        const logger = new LogService();

        try {
            logger.startAt();

            const { email, filter } = payload;

            const orderService = new OrderService();

            const dataToFormat = await orderService.exportData(filter, { lean: true });

            const dataFormated = XlsxMapper.mapOrderToXlsx(dataToFormat)

            file = FileService.createXlsxLocally(dataFormated)

            await EmailService.send({
                from: 'no-reply@infracommerce.com.br',
                to: email,
                attachments: [file],
                subject: "Status_Entregas",
                body: {
                    text: "Please do not reply this e-mail.",
                    html: "<b>Please do not reply this e-mail.</b>"
                }
            });
        } catch (error) {
            logger.error(error);
            logger.endAt();
            await logger.sendLog();
        } finally {

            if(FileService.existsLocally(file.path)){
                FileService.deleteFileLocally(file.path)
            }

            done()
        }

    }
}
