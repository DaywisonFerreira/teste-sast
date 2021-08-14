import { RequestPrivate, Response, helpers } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';
const { HttpHelper } = helpers;

import { OrderService } from '../services/orderService';

/**
 * GET /orders/delivery-companies
 */
export default async (req: RequestPrivate, res: Response): Promise<void> => {
    const logger = new LogService();
    try {
        logger.startAt();
        const orderService = new OrderService();
        const list = await orderService.getDeliveryCompanies(
        );

        HttpHelper.ok(
            res,
            list
        );
    } catch (error) {
        logger.error(error);
        logger.endAt();
        await logger.sendLog();
        HttpHelper.fail(res, error);
    }
};
