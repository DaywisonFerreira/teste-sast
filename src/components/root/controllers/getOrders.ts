import { Response, helpers } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';

import { Order } from '../interfaces/Order';
import { QueryParamsFilter, OrderService } from '../services/orderService';
import { IRequest } from '../../../common/interfaces/request';

const { PaginationHelper, HttpHelper } = helpers;

const SORTABLE_FIELDS = [
    'orderCreatedAt', // default
    'orderSale',
    'order',
    'status',
    'receiverName',
    'logisticInfo.deliveryCompany',
    'billingData.invoiceValue',
    'logisticInfo.shippingEstimateDate',
    'orderUpdatedAt',
];

/**
 * GET /orders
 */
export default async (req: IRequest, res: Response): Promise<void> => {
    const logger = new LogService();
    try {
        logger.startAt();
        const { storeId } = req;
        const {
            orderId, //Número do pedido ERP/VTEX
            receiverName, // nome do cliente
            orderCreatedAtFrom, //data da compra
            orderCreatedAtTo,
            deliveryCompany, //transportadora
            orderUpdatedAtFrom, //data do status
            orderUpdatedAtTo,
            status, // status Ihub
        } = req.query;

        const paginationParams = PaginationHelper.createPaginationParams(
            req,
            SORTABLE_FIELDS,
        );

        const filter = {
            orderId,
            receiverName,
            orderCreatedAtFrom,
            orderCreatedAtTo,
            deliveryCompany,
            orderUpdatedAtFrom,
            orderUpdatedAtTo,
            status,
            storeId,
        } as QueryParamsFilter;

        const fields = Order.getPublicFields.reduce((current: any, item) => {
            current[item] = 1;
            return current;
        }, {});

        const projectionFields = { ...fields, _id: 0 };

        const orderService = new OrderService();
        const paginatedResponse = await orderService.getList(
            filter,
            projectionFields,
            { lean: true },
            paginationParams,
        );

        logger.add('getOrders.message', `Request received from ${req.email}`);
        logger.endAt();
        await logger.sendLog();

        HttpHelper.ok(
            res,
            PaginationHelper.getPaginatedResponse(paginatedResponse),
        );
    } catch (error) {
        logger.error(error);
        logger.endAt();
        await logger.sendLog();
        HttpHelper.fail(res, error);
    }
};
