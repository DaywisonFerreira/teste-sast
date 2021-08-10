import { LogService } from '@infralabs/infra-logger';
import { OrderMapper } from '../mappers/orderMapper';
import { OrderRepository } from '../repositories/orderRepository';

export default class HandleOrderNotification {
    constructor() {}

    async execute(payload: any, done: Function): Promise<void> {
        const logger = new LogService();

        try {
            logger.startAt();
            const orderRepository = new OrderRepository();
            if (payload.status === 'dispatched' || payload.status === 'delivered') {
                const orderToSave = OrderMapper.mapMessageToOrder(payload);
                await orderRepository.create(orderToSave);
            }
        } catch (error) {
            logger.error(error);
            logger.endAt();
            await logger.sendLog();
        } finally {
            done();
        }
    }
}
