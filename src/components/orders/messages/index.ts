import { Task } from 'ihub-framework-ts';
import HandleExportOrders from './handleExportOrders';
import HandleOrderNotification from './handleOrderNotification';
import HandleImportOrder from './handleImportOrder';

export default [
    {
        exchange: 'orderNotification',
        routeKey: '',
        queue: 'tracking_order_notification_q',
        type: 'fanout',
        action: (payload, done) => new HandleOrderNotification().execute(payload, done),
    },
    {
        exchange: 'exportOrders',
        routeKey: 'exportOrders',
        queue: 'export_orders_q',
        action: (payload, done) => new HandleExportOrders().execute(payload, done),
    },
    {
        exchange: 'deliveryHub',
        routeKey: 'importOrder',
        queue: 'delivery_hub_import_order_q',
        action: (payload, done) => new HandleImportOrder().execute(payload, done),
    }
] as Task[];
