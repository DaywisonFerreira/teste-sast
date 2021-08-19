import { XlsxMapper } from '../mappers/xlsxMapper';
import { EmailService } from '../../../common/services/emailService';
import { FileService } from '../../../common/services/fileService';
import { OrderService } from '../services/orderService';
import { ConfigService } from '../../../components/configs/services/configService';

import { LogService } from '@infralabs/infra-logger';
export default class HandleExportOrders {
    private file = {
        path:'',
        fileName:''
    }
    constructor() {
        this.file.path = ''
        this.file.fileName = ''
    }

    async execute(payload: any, done: Function): Promise<void> {
        const logger = new LogService();

        try {
            logger.startAt();

            const { email, filter, config } = payload;

            const { storeCode } = config

            const orderService = new OrderService();

            const dataToFormat = await orderService.exportData(filter, { lean: true });

            const dataFormated = XlsxMapper.mapOrderToXlsx(dataToFormat)

            this.file = FileService.createXlsxLocally(dataFormated, { storeCode, filter })

            await EmailService.send({
                from: 'no-reply@infracommerce.com.br',
                to: email,
                attachments: [this.file],
                subject: `${storeCode}_Status_Entregas`,
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

            if(FileService.existsLocally(this.file.path)){
                FileService.deleteFileLocally(this.file.path)
            }

            done()
        }

    }
}
