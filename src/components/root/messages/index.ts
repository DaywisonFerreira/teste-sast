import { Task } from 'ihub-framework-ts';
import HandleSellerNotification from './handleSellerNotification';
import HandleStoreNotification from './handleStoreNotification';
import HandleExportOrders from './handleExportOrders';
import HandleOrderNotification from './handleOrderNotification';
import HandleImportOrder from './handleImportOrder';

export default [
    {
        exchange: 'sellerNotification',
        routeKey: '',
        queue:  `delivery_hub_seller_notification_${process.env.NODE_ENV}_q`,
        action: (payload, done) => new HandleSellerNotification().execute(payload, done),
        type: 'fanout',
    },
    {
        exchange: 'storeNotification',
        routeKey: '',
        queue:  `delivery_hub_store_notification_${process.env.NODE_ENV}_q`,
        action: (payload, done) => new HandleStoreNotification().execute(payload, done),
        type: 'fanout',
    },
    {
        exchange: 'orderNotification',
        routeKey: '',
        queue:  `delivery_hub_order_notification_${process.env.NODE_ENV}_q`,
        type: 'fanout',
        prefetch: 5,
        action: (payload, done) => new HandleOrderNotification().execute(payload, done),
    },
    {
        exchange: 'deliveryHub',
        routeKey: 'exportOrders',
        queue:  `delivery_hub_export_orders_${process.env.NODE_ENV}_q`,
        action: (payload, done) => new HandleExportOrders().execute(payload, done),
    },
    {
        exchange: 'deliveryHub',
        routeKey: 'importOrder',
        queue:  `delivery_hub_import_order_${process.env.NODE_ENV}_q`,
        action: (payload, done) => new HandleImportOrder().execute(payload, done),
    }
] as Task[];
