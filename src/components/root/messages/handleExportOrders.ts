import { LogService } from '@infralabs/infra-logger';

import { CsvMapper } from '../mappers/csvMapper';
import { EmailService } from '../../../common/services/emailService';
import { FileService } from '../../../common/services/fileService';
import { OrderService } from '../services/orderService';
import { AzureService } from '../../../common/services/azureService';

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
            const dataFormatted = CsvMapper.mapOrderToCsv(dataToFormat);

            this.file = await FileService.createCsvLocally(dataFormatted,{ storeCode, filter }, logger);

            const urlFile = await AzureService.uploadFile(this.file, logger)

            //TODO: NOTIFICAR USUARIO VIA WEBSOCKET COM O LINK(urlFile)

            logger.add('ifc.freight.api.orders.handleExportOrders.execute', 'Payload received and data sent');
        } catch (error) {
            logger.error(error);
        } finally {

            if (this.file.path && FileService.existsLocally(this.file.path, logger)) {
                await FileService.deleteFileLocally(this.file.path, logger);
            }

            logger.endAt();
            await logger.sendLog();
            done();
        }
    }
}
