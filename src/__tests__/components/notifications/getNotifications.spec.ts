import { errors, models, common } from 'ihub-framework-ts';

import { NotificationService } from '../../../components/root/services/notificationService';
import { newNotification } from './utils.jest';

const SORTABLE_FIELDS = [
    'createdAt', // default
];

const fields = {
    notificationType: 1,
    payload: 1,
    createdAt: 1,
    'notifiedUsers.$': 1,
    _id: 1
}

const paginationParams = {
    pageNumber: 1,
    perPage: 20,
    orderBy: 'createdAt',
    orderDirection: 'desc',
    sortableFields: SORTABLE_FIELDS,
} as common.Types.PaginationParams;

describe('Unit Test - Notification Service', () => {
    afterAll(async () => {
        const { Notification } = models;
        await Promise.all([Notification.deleteMany({})]);
    });

    beforeEach(async () => {
        const { Notification } = models;
        await Promise.all([Notification.deleteMany({})]);
        await Notification.insertMany([
            newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", read: false }], { urlFile: "URL_BLOB_STORAGE" }),
            newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173A", read: true }], { urlFile: "URL_BLOB_STORAGE" }),
            newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", read: true }, { user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173A", read: false }], { urlFile: "URL_BLOB_STORAGE" })
        ]);
    });

    describe('List Notifications', () => {
        it('should return a list of notifications filtered by UserId', async () => {
            const service = new NotificationService();
            const response = await service.listNotifications("bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", {}, fields, paginationParams)
            expect(response.data.length).toBe(2);
        });

        it('should return a list of unread notifications filtered by UserId', async () => {
            const service = new NotificationService();
            const response = await service.listNotifications("bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", { read: "false" }, fields, paginationParams)

            const aux = response.data as any;
            expect(response.data.length).toBe(1);
            expect(aux[0].read).toBe(false);
        });

        it('should return a list of read notifications filtered by UserId', async () => {
            const service = new NotificationService();
            const response = await service.listNotifications("bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", { read: "true" }, fields, paginationParams)

            const aux = response.data as any;
            expect(response.data.length).toBe(1);
            expect(aux[0].read).toBe(true);
        });
    });

    describe('markAsRead', () => {
        it('should mark a single notification as Read', async () => {
            const { Notification } = models;
            const notification = newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", read: false }], { urlFile: "URL_BLOB_STORAGE" })
            const notificationCreated = await Notification.create(notification)

            const service = new NotificationService();
            const response = await service.markAsRead("bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", notificationCreated._id) as any

            expect(response.notifiedUsers[0].read).toBe(true);

            expect(response).toHaveProperty('_id');
            expect(response).toHaveProperty('notifiedUsers');
            expect(response).toHaveProperty('payload');
            expect(response).toHaveProperty('createdAt');
            expect(response).toHaveProperty('updatedAt');
            expect(response).toHaveProperty('notificationType');
        });

        it('should mark a single notification as unRead', async () => {
            const { Notification } = models;
            const notification = newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", read: true }], { urlFile: "URL_BLOB_STORAGE" })
            const notificationCreated = await Notification.create(notification)

            const service = new NotificationService();
            const response = await service.markAsRead("bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", notificationCreated._id) as any

            expect(response.notifiedUsers[0].read).toBe(false);

            expect(response).toHaveProperty('_id');
            expect(response).toHaveProperty('notifiedUsers');
            expect(response).toHaveProperty('payload');
            expect(response).toHaveProperty('createdAt');
            expect(response).toHaveProperty('updatedAt');
            expect(response).toHaveProperty('notificationType');
        });

        it('should mark All Notifications as Read', async () => {
            const { Notification } = models;
            const notification = newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", read: false }], { urlFile: "URL_BLOB_STORAGE" })

            await Notification.create(notification)

            const service = new NotificationService();
            const response = await service.markAsRead("bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", null, "true") as any

            expect(response.ok).toBe(1);
            expect(response).toHaveProperty('n');
            expect(response).toHaveProperty('nModified');
            expect(response).toHaveProperty('ok');
        });

        it('should mark All Notifications as unRead', async () => {
            const { Notification } = models;
            const notification = newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", read: true }], { urlFile: "URL_BLOB_STORAGE" })

            await Notification.create(notification)

            const service = new NotificationService();
            const response = await service.markAsRead("bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", null, "false") as any

            expect(response.ok).toBe(1);
            expect(response).toHaveProperty('n');
            expect(response).toHaveProperty('nModified');
            expect(response).toHaveProperty('ok');
        });
    });

    describe('save', () => {
        it('should mark a single notification as Read', async () => {
            const notification = newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", read: false }], { urlFile: "URL_BLOB_STORAGE" })

            const service = new NotificationService();
            const response = await service.save(notification) as any

            expect(response).toHaveProperty('_id');
            expect(response).toHaveProperty('notifiedUsers');
            expect(response).toHaveProperty('payload');
            expect(response).toHaveProperty('createdAt');
            expect(response).toHaveProperty('updatedAt');
            expect(response).toHaveProperty('notificationType');
        });
    });
});
