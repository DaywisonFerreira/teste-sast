import { Response, helpers } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';
// Helpers
const { PaginationHelper, HttpHelper } = helpers;

// // Interfaces
// import { Order } from '../interfaces/Order';

// // Services
// import { QueryParamsFilter, OrderService } from '../services/orderService';
import { IRequest } from '../../../common/interfaces/request';
import { ConfigService } from '../services/configService';

export default async (req: IRequest, res: Response): Promise<void> => {
    const logger = new LogService();
    try {
        logger.startAt();
        const { stores } = req

        const configService = new ConfigService()

        const response = await configService.findStoresOfUser(stores)

        HttpHelper.ok(
            res,
            response
        );
    } catch (error) {
        logger.error(error);
        logger.endAt();
        await logger.sendLog();
        HttpHelper.fail(res, error);
    }
};
