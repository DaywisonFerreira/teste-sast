import { RequestPrivate, Response, helpers, tasks } from 'ihub-framework-ts';

const { HttpHelper } = helpers;

import { OrderService, QueryParamsFilter,  } from '../services/orderService';

export = async (req: RequestPrivate, res: Response) => {
    try {


        const { email } = req.body

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
        HttpHelper.fail(res, error);
    }
};
