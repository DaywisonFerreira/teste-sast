import { LogService } from '@infralabs/infra-logger';

import { XlsxMapper } from '../mappers/xlsxMapper';
import { EmailService } from '../../../common/services/emailService';
import { FileService } from '../../../common/services/fileService';
import { OrderService } from '../services/orderService';

export default class HandleExportOrders {
    private file = {
        path: '',
        fileName: ''
    };

    constructor() {
        this.file.path = '';
        this.file.fileName = '';
    }

    async execute(payload: any, done: Function): Promise<void> {
        const logger = new LogService();

        try {
            logger.startAt();
            const { email, filter, config } = payload;
            const { storeCode } = config;
            logger.add('ifc.freight.api.orders.handleExportOrders.execute', `Request received from ${email}, starting to be processed`);
            const orderService = new OrderService();
            const dataToFormat = await orderService.exportData(filter, { lean: true });
            const dataFormatted = XlsxMapper.mapOrderToXlsx(dataToFormat);

            this.file = FileService.createXlsxLocally(dataFormatted, { storeCode, filter }, logger);

            await EmailService.send({
                to: email,
                attachments: [this.file],
                subject: `${storeCode}_Status_Entregas`,
                body: {
                    text: 'Please do not reply this e-mail.',
                    html: '<b>Please do not reply this e-mail.</b>'
                }
            }, logger);

            logger.add('ifc.freight.api.orders.handleExportOrders.execute', 'Payload received and data sent');
        } catch (error) {
            logger.error(error);
        } finally {
            if (FileService.existsLocally(this.file.path, logger)) {
                await FileService.deleteFileLocally(this.file.path, logger);
            }

            logger.endAt();
            await logger.sendLog();
            done();
        }
    }
}
