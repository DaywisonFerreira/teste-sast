import { models, logger } from 'ihub-framework-ts';
import { StoreRepository } from '../repositories/storeRepository';
import { OrderRepository } from '../repositories/orderRepository';

import { OrderMapper } from '../mappers/orderMapper';

const orderRepository = new OrderRepository();

const storeRepository = new StoreRepository(models.Store);

/**
 * Reloads news stores at the local database
 * @param store New store
 * @param done
 */
async function processReloadStore(store: any, done: Function) {
    try {
        logger.debug(
            'Received an ReloadStoreConfig',
            'tracking.feed.task.reloadStore',
            store
        );
        const options = {
            upsert: true,
            runValidators: true,
            useFindAndModify: false,
        };
        await storeRepository.findOneAndUpdate(
            { _id: store._id },
            {
                active: store.active,
                code: store.code,
                name: store.name,
                description: store.description,
                siteUrl: store.siteUrl,
                icon: store.icon,
                createdBy: store.createdBy,
            },
            options
        );
        logger.info(
            `The store ${store.code} has been successfully merged.`,
            'tracking.feed.task.reloadStore'
        );
    } catch (error) {
        // Logs the uncaught error for futher treatment
        logger.error(error.message, 'tracking.feed.task.reloadStore.error');
    }

    logger.debug(
        'Finished the processing of the ReloadStoreConfig event.',
        'tracking.feed.task.reloadStore',
        store
    );

    // Call done() after everthing is done, await for any database queries or async functions before doing it
    done(); // Sends the ACK to the RabbitMQ
}

export async function executeOrderNotification(payload: any, done: Function) {
    try {
        if (payload.status === 'dispatched' || payload.status === 'delivered') {
            const orderToSave = OrderMapper.mapMessageToOrder(payload);
            logger.debug('Create order', 'iht.tasks.executeOrder', orderToSave);
            await orderRepository.create(orderToSave);
        }
    } catch (error) {
        logger.error(error.message, 'iht.tasks.error', { stack: error.stack });
    } finally {
        done();
    }
}

export default {
    processReloadStore,
    executeOrderNotification,
};
