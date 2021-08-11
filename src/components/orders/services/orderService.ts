import { common, errors } from 'ihub-framework-ts';
import { ObjectId } from 'mongodb';
import { differenceInDays, isBefore } from 'date-fns';
// Interfaces
import { Order } from '../interfaces/Order';

// Services
import { OrderRepository } from '../repositories/orderRepository';
import { isValidObjectId } from '../validations';
import { BaseService } from '../../../common/services/baseService';

const { BadRequestError } = errors;

export interface QueryParamsFilter {
    orderId: string;
    receiverName: string;
    orderCreatedAtFrom: string;
    orderCreatedAtTo: string;
    deliveryCompany: string;
    orderUpdatedAtFrom: string;
    orderUpdatedAtTo: string;
    status: string;
}

export class OrderService extends BaseService<Order, OrderRepository> {
    constructor() {
        super(new OrderRepository());
    }
    async getList(
        {
            orderId,
            receiverName,
            deliveryCompany,
            orderCreatedAtFrom,
            orderCreatedAtTo,
            orderUpdatedAtFrom,
            orderUpdatedAtTo,
            status,
        }: Partial<QueryParamsFilter>,
        fields: any,
        options: any,
        paginationParams: common.Types.PaginationParams
    ): Promise<common.Types.PaginatedResponseParams<Order>> {
        const conditions: any = {};

        if (receiverName) {
            conditions['receiverName'] = {
                $regex: `.*${receiverName}.*`,
                $options: 'i',
            };
        }
        if (status) {
            conditions['status'] = {
                $regex: `.*${status}.*`,
                $options: 'i',
            };
        }

        if (deliveryCompany) {
            conditions['logisticInfo'] = {
                $elemMatch: {
                    deliveryCompany: {
                        $regex: `.*${deliveryCompany}.*`,
                        $options: 'i',
                    },
                },
            };
        }

        if (orderId) {
            if (!isValidObjectId(orderId)) {
                throw new BadRequestError('Invalid Id');
            }
            conditions['orderId'] = new ObjectId(orderId);
        }

        if (orderCreatedAtFrom && orderCreatedAtTo) {
            const dateFrom = new Date(`${orderCreatedAtFrom} 00:00:00Z`);
            const dateTo = new Date(`${orderCreatedAtTo} 23:59:59Z`);
            this.validateRangeOfDates(dateFrom, dateTo);
            conditions['orderCreatedAt'] = {
                $gte: dateFrom,
                $lte: dateTo,
            };
        }

        if (orderCreatedAtFrom && !orderCreatedAtTo) {
            conditions['orderCreatedAt'] = {
                $gte: new Date(`${orderCreatedAtFrom} 00:00:00Z`),
                $lte: new Date(`${orderCreatedAtFrom} 23:59:59Z`),
            };
        }

        if (orderUpdatedAtFrom && orderUpdatedAtTo) {
            const dateFrom = new Date(`${orderUpdatedAtFrom} 00:00:00Z`);
            const dateTo = new Date(`${orderUpdatedAtTo} 23:59:59Z`);
            this.validateRangeOfDates(dateFrom, dateTo);
            conditions['orderUpdatedAt'] = {
                $gte: dateFrom,
                $lte: dateTo,
            };
        }

        if (orderUpdatedAtFrom && !orderUpdatedAtTo) {
            conditions['orderUpdatedAt'] = {
                $gte: new Date(`${orderUpdatedAtFrom} 00:00:00Z`),
                $lte: new Date(`${orderUpdatedAtFrom} 23:59:59Z`),
            };
        }

        // Does the pagination on database
        return this.repository.pagination(
            conditions,
            fields,
            options,
            paginationParams
        );
    }

    async exportData(
        {
            orderCreatedAtFrom,
            orderCreatedAtTo,
        }: Partial<QueryParamsFilter>,
        options: any,
    ){

        const conditions: any = {};

        if (orderCreatedAtFrom && orderCreatedAtTo) {
            const dateFrom = new Date(`${orderCreatedAtFrom} 00:00:00Z`);
            const dateTo = new Date(`${orderCreatedAtTo} 23:59:59Z`);
            this.validateRangeOfDates(dateFrom, dateTo);
            conditions['orderCreatedAt'] = {
                $gte: dateFrom,
                $lte: dateTo,
            };
        }

        if (orderCreatedAtFrom && orderCreatedAtTo) {
            const dateFrom = new Date(`${orderCreatedAtFrom} 00:00:00Z`);
            const dateTo = new Date(`${orderCreatedAtTo} 23:59:59Z`);
            this.validateRangeOfDates(dateFrom, dateTo);
            conditions['orderCreatedAt'] = {
                $gte: dateFrom,
                $lte: dateTo,
            };
        }

        return this.repository.find(
            conditions,
            {},
            options
        );
    }

    public validateRangeOfDates(dateFrom: Date, dateTo: Date) {
        if (differenceInDays(dateTo, dateFrom) > 31) {
            throw new BadRequestError('Date difference greater than 1 month');
        }

        if (isBefore(dateTo, dateFrom)) {
            throw new BadRequestError('Invalid range of dates');
        }
    }
}
