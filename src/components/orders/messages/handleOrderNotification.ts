import { OrderMapper } from '../mappers/orderMapper';
import { OrderRepository } from '../repositories/orderRepository';
import { IhubLogger } from './interfaces/IhubLogger';


export class HandleOrderNotification {
    constructor(private logger: IhubLogger) {}

    async execute(payload: any, done: Function): Promise<void> {
        try {
            const orderRepository = new OrderRepository();

            if (payload.status === 'dispatched' || payload.status === 'delivered') {
                const orderToSave = OrderMapper.mapMessageToOrder(payload);
                this.logger.debug('Create order', 'iht.tasks.executeOrder', orderToSave);
                await orderRepository.create(orderToSave);
            }
        } catch (error) {
            this.logger.error(error.message, 'iht.tasks.error', { stack: error.stack });
        } finally {
            done();
        }
    }
}
