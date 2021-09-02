import { RequestPrivate, Response, helpers } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';
const { HttpHelper } = helpers;

import { OrderService } from '../services/orderService';
import { IRequest } from '../../../common/interfaces/request'

/**
 * GET /orders/delivery-companies
 */
export default async (req: IRequest, res: Response): Promise<void> => {
    const logger = new LogService();
    try {
        logger.startAt();
        const orderService = new OrderService();
        const list = await orderService.getDeliveryCompanies(
        );

        logger.add('ifc.freight.api.orders.getDeliveryCompanies', `Request received from ${req.email}, Payload: ${JSON.stringify(list)}`);
        logger.endAt();
        await logger.sendLog();

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
