import { common, errors } from 'ihub-framework-ts';
import { differenceInDays, isBefore } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz'

import { ObjectID } from 'mongodb';
// Interfaces
import { Order } from '../interfaces/Order';

// Services
import { OrderRepository } from '../repositories/orderRepository';
import { BaseService } from '../../../common/services/baseService';
import { isValidObjectId } from '../validations';

const { BadRequestError } = errors;

export interface QueryParamsFilter {
    storeId: string,
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
            storeId,
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

        if (storeId) {
            if (!isValidObjectId(storeId)) {
                throw new BadRequestError('Invalid storeId');
            }
            conditions['storeId'] = new ObjectID(storeId);
        }

        if (receiverName) {
            conditions.$text = {
                $search: receiverName
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
            // orderSale -> pedido VTEX
            // order -> pedido erp
            conditions.$text = {
                $search: `"${orderId}"`
            }
        }

        if (orderCreatedAtFrom && orderCreatedAtTo) {
            const dateFrom = new Date(`${orderCreatedAtFrom}`);
            const dateTo = new Date(`${orderCreatedAtTo} 23:59:59`);
            this.validateRangeOfDates(dateFrom, dateTo);
            conditions['orderCreatedAt'] = {
                $gte: dateFrom,
                $lte: dateTo,
            };
        }

        if (orderCreatedAtFrom && !orderCreatedAtTo) {
            const from = new Date(`${orderCreatedAtFrom} 00:00:00Z`);
            const to = new Date(`${orderCreatedAtFrom} 23:59:59Z`);
            const timeZone = 'America/Sao_Paulo';
            const $gte = utcToZonedTime(from, timeZone);
            const $lte = utcToZonedTime(to, timeZone);
            conditions['orderCreatedAt'] = { $gte, $lte };
        }

        if (orderUpdatedAtFrom && orderUpdatedAtTo) {
            const dateFrom = new Date(`${orderUpdatedAtFrom}`);
            const dateTo = new Date(`${orderUpdatedAtTo} 23:59:59`);
            this.validateRangeOfDates(dateFrom, dateTo);
            conditions['orderUpdatedAt'] = {
                $gte: dateFrom,
                $lte: dateTo,
            };
        }

        if (orderUpdatedAtFrom && !orderUpdatedAtTo) {
            conditions['orderUpdatedAt'] = {
                $gte: new Date(orderUpdatedAtFrom),
                $lte: new Date(`${orderUpdatedAtFrom} 23:59:59`),
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

    async getDeliveryCompanies(): Promise<string[]> {
        return this.repository.distinct('logisticInfo.deliveryCompany')
    }

    async exportData(
        {
            orderCreatedAtFrom,
            orderCreatedAtTo,
            storeId
        }: Partial<QueryParamsFilter>,
        options: any,
    ) {

        const conditions: any = {
            storeId
        };

        if (orderCreatedAtFrom && orderCreatedAtTo) {
            const dateFrom = new Date(`${orderCreatedAtFrom} 00:00:00`);
            const dateTo = new Date(`${orderCreatedAtTo} 23:59:59`);
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
