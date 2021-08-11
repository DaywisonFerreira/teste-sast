import { RequestPrivate, Response, helpers, tasks } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';

import JWT from '../../../utils/JwtUtils';

const { HttpHelper } = helpers;

import { OrderService, QueryParamsFilter,  } from '../services/orderService';

export = async (req: RequestPrivate, res: Response) => {
    const logger = new LogService();

    try {
        logger.startAt();

        const { authorization } = req.headers

        const { email } = JWT.decode(authorization)

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
        } as QueryParamsFilter;

        tasks.send(
            'exportOrders',
            'exportOrders',
            JSON.stringify({ email, filter })
        );

        return res.json({ message: `Export request queued, will sent to: ${email}`});
    } catch (error) {
        logger.error(error);
        logger.endAt();
        await logger.sendLog();
        HttpHelper.fail(res, error);
    }
};
