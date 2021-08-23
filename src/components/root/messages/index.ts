import { Task } from 'ihub-framework-ts';
import HandleSellerNotification from './handleSellerNotification';
import HandleStoreNotification from './handleStoreNotification';

export default [
    {
        exchange: 'sellerNotification',
        routeKey: '',
        queue: 'delivery_hub_seller_notification_q',
        action: (payload, done) => new HandleSellerNotification().execute(payload, done),
        type: 'fanout',
      },
      {
        exchange: 'storeNotification',
        routeKey: '',
        queue: 'delivery_hub_store_notification_q',
        action: (payload, done) => new HandleStoreNotification().execute(payload, done),
        type: 'fanout',
      },
] as Task[];
