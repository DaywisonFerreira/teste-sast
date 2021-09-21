import { common } from 'ihub-framework-ts';

interface UsersLogged {
    socketId: string,
    email: string,
    userId: string
}

interface NotifiedUsers {
    user: String,
    read: Boolean
}

class Notification extends common.Types.BaseEntity {
    notificationType: NotificationTypes;
    notifiedUsers: NotifiedUsers[];
    payload?: String | any;
}

enum NotificationTypes {
    OrdersExportCSV = "orders.export.csv"
}

export { UsersLogged, Notification, NotificationTypes }
