import { LogService } from '@infralabs/infra-logger';

import { CsvMapper } from '../mappers/csvMapper';
import { FileService } from '../../../common/services/fileService';
import { OrderService } from '../services/orderService';
import { AzureService } from '../../../common/services/azureService';
import { notifyUser } from '../../../socket';
import { NotificationTypes } from '../../../common/interfaces/socket';

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
            const { userId, filter, config } = payload;
            const { storeCode } = config;

            logger.add('ifc.freight.api.orders.handleExportOrders.execute', `Request received from userId: ${userId}, starting to be processed`);
            // const orderService = new OrderService();
            // const dataToFormat = await orderService.exportData(filter, { lean: true });
            // const dataFormatted = CsvMapper.mapOrderToCsv(dataToFormat);

            // this.file = await FileService.createCsvLocally(dataFormatted,{ storeCode, filter }, logger);

            // const urlFile = await AzureService.uploadFile(this.file, logger)
            const urlFile = "URL_BLOB_STORAGE"

            await notifyUser(userId, {
                notificationType: NotificationTypes.OrdersExportCSV,
                payload: { urlFile }
            })

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
