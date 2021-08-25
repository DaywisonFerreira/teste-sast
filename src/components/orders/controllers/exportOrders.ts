import { Response, helpers, tasks } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';

import { IRequest } from '../../../common/interfaces/request';

const { HttpHelper } = helpers;

import { OrderService, QueryParamsFilter  } from '../services/orderService';

export = async (req: IRequest, res: Response) => {
    const logger = new LogService();

    try {
        logger.startAt();

        const { storeId, email, config } = req

        const orderService = new OrderService();

        if(!email) throw new Error('An Email is required');

        const { orderCreatedAtFrom, orderCreatedAtTo }: any = req.query;

        if(!orderCreatedAtFrom || !orderCreatedAtTo) {
            throw new Error('A range with dates is required');
        }

        orderService.validateRangeOfDates(new Date(orderCreatedAtFrom), new Date(orderCreatedAtTo))

        const filter = {
            orderCreatedAtFrom,
            orderCreatedAtTo,
            storeId
        } as QueryParamsFilter;

        tasks.send(
            'deliveryHub',
            'exportOrders',
            JSON.stringify({ email, filter, config })
        );

        HttpHelper.ok(
            res,
            {
                message: `Export request queued, will sent to: ${email}`,
            }
        );
    } catch (error) {
        logger.error(error);
        logger.endAt();
        await logger.sendLog();
        HttpHelper.fail(res, error);
    }
};
