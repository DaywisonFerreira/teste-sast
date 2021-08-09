import { common, errors, models } from 'ihub-framework-ts';
import { ObjectId } from 'mongodb';
import { startOfDay, endOfDay, differenceInCalendarMonths, isBefore } from 'date-fns';
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
            const dateFrom = new Date(orderCreatedAtFrom);
            const dateTo = new Date(orderCreatedAtTo);
            this.validateRangeOfDates(dateFrom, dateTo);
            conditions['orderCreatedAt'] = {
                $gte: startOfDay(dateFrom),
                $lte: endOfDay(dateTo),
            };
        }

        if (orderCreatedAtFrom && !orderCreatedAtTo) {
            conditions['orderCreatedAt'] = {
                $gte: startOfDay(new Date(orderCreatedAtFrom)),
                $lte: endOfDay(new Date(orderCreatedAtFrom)),
            };
        }

        if (orderUpdatedAtFrom && orderUpdatedAtTo) {
            const dateFrom = new Date(orderUpdatedAtFrom);
            const dateTo = new Date(orderUpdatedAtTo);
            this.validateRangeOfDates(dateFrom, dateTo);
            conditions['orderUpdatedAt'] = {
                $gte: startOfDay(dateFrom),
                $lte: endOfDay(dateTo),
            };
        }

        if (orderUpdatedAtFrom && !orderUpdatedAtTo) {
            conditions['orderUpdatedAt'] = {
                $gte: startOfDay(new Date(orderUpdatedAtFrom)),
                $lte: endOfDay(new Date(orderUpdatedAtFrom)),
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
            const dateFrom = new Date(orderCreatedAtFrom);
            const dateTo = new Date(orderCreatedAtTo);
            this.validateRangeOfDates(dateFrom, dateTo);
            conditions['orderCreatedAt'] = {
                $gte: startOfDay(dateFrom),
                $lte: endOfDay(dateTo),
            };
        }

        return this.repository.find(
            conditions,
            {},
            options
        );
    }

    public validateRangeOfDates(dateFrom: Date, dateTo: Date) {
        if (differenceInCalendarMonths(dateTo, dateFrom) > 1) {
            throw new BadRequestError('Date difference greater than 1 month');
        }

        if (isBefore(dateTo, dateFrom)) {
            throw new BadRequestError('Invalid range of dates');
        }
    }
}
