import { Task } from 'ihub-framework-ts';
import task from './task';

const messages: Array<Task> = [];

messages.push({
    exchange: 'storeNotification',
    routeKey: '',
    queue: 'tracking_feed_reload_store_config_q',
    action: task.processReloadStore,
    type: 'fanout',
});

messages.push({
    exchange: 'orderNotification',
    routeKey: '',
    queue: 'tracking_order_notification_q',
    action: task.executeOrderNotification,
    type: 'fanout',
});

export = messages;
