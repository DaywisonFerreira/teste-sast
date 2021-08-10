import { Task } from 'ihub-framework-ts';
import HandleExportOrders from './handleExportOrders';
import HandleOrderNotification from './handleOrderNotification';

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
    }
] as Task[];
