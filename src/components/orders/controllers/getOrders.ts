import { RequestPrivate, Response, helpers } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';
// Helpers
const { PaginationHelper, HttpHelper } = helpers;

// Interfaces
import { Order } from '../interfaces/Order';

// Services
import { QueryParamsFilter, OrderService } from '../services/orderService';

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
export default async (req: RequestPrivate, res: Response): Promise<void> => {
    const logger = new LogService();
    try {
        logger.startAt();
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
            SORTABLE_FIELDS
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
            paginationParams
        );

        HttpHelper.ok(
            res,
            PaginationHelper.getPaginatedResponse(paginatedResponse)
        );
    } catch (error) {
        logger.error(error);
        logger.endAt();
        await logger.sendLog();
        HttpHelper.fail(res, error);
    }
};
