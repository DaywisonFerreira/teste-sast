import { LogService } from '@infralabs/infra-logger';

import { OrderMapper } from '../mappers/orderMapper';
import { OrderRepository } from '../repositories/orderRepository';

export default class HandleOrderNotification {
    constructor() { }

    async execute(payload: any, done: Function): Promise<void> {
        const logger = new LogService();
        try {
            logger.startAt();
            logger.add('handleOrderNotification.message', `Order ${payload.externalOrderId} was received in the integration queue`);
            const orderRepository = new OrderRepository();
            if (payload.status === 'dispatched' || payload.status === 'delivered') {
                const orderToSave = OrderMapper.mapMessageToOrder(payload);
                await orderRepository.merge({ orderSale: orderToSave.orderSale }, orderToSave);
                logger.add('handleOrderNotification.order', JSON.stringify(orderToSave));
            }
            logger.endAt();
            await logger.sendLog();
        } catch (error) {
            logger.error(error);
            logger.endAt();
            await logger.sendLog();
        } finally {
            done();
        }
    }
}
