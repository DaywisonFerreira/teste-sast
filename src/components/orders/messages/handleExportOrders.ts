import { XlsxMapper } from '../mappers/xlsxMapper';
import { EmailService } from '../../../common/services/emailService';
import { FileService } from '../../../common/services/fileService';
import { OrderService } from '../services/orderService';

import { IhubLogger } from './interfaces/IhubLogger';

export class HandleExportOrders {
    constructor(private logger: IhubLogger) {}

    async execute(payload: any, done: Function): Promise<void> {
        let file = {
            path:'',
            fileName:''
        }

        try {
            const { email, filter } = payload;

            const orderService = new OrderService();

            const dataToFormat = await orderService.exportData(filter, { lean: true });

            const dataFormated = XlsxMapper.mapOrderToXlsx(dataToFormat)

            file = FileService.createXlsxLocally(dataFormated)

            const emailSent = await EmailService.send({
                from: 'infracommerce.notify@infracommerce.com.br',
                to: email,
                attachments: [file],
                subject: "Status_Entregas",
                body: {
                    text: "Please do not reply this e-mail.",
                    html: "<b>Please do not reply this e-mail.</b>"
                }
            });

            this.logger.debug('Export orders', 'iht.tasks.handleExportOrders', { emailSent });
        } catch (error) {
            this.logger.error(error.message, 'iht.tasks.handleExportOrders', { stack: error.stack });
        } finally {

            if(FileService.existsLocally(file.path)){
                FileService.deleteFileLocally(file.path)
            }

            done()
        }

    }
}
