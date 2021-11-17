import { Response, helpers } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';

import { OrderService } from '../services/orderService';
import { IRequest } from '../../../common/interfaces/request';

const { HttpHelper } = helpers;

export default async (req: IRequest, res: Response): Promise<void> => {
    const logger = new LogService();
    try {
        const { storeId } = req;
        logger.startAt();
        const orderService = new OrderService();
        const list = await orderService.getDeliveryCompanies(storeId);

        logger.add('getDeliveryCompanies.message', `Request received from ${req.email}, Payload: ${JSON.stringify(list)}`);
        logger.endAt();
        await logger.sendLog();

        HttpHelper.ok(res, list);
    } catch (error) {
        logger.error(error);
        logger.endAt();
        await logger.sendLog();
        HttpHelper.fail(res, error);
    }
};
