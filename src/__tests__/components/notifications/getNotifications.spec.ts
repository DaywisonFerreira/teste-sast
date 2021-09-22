import { errors, models, common } from 'ihub-framework-ts';

import { NotificationService } from '../../../components/root/services/notificationService';
import { newNotification } from './utils.jest';
// import { newConfig } from './utils.jest';

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

describe('Unit Test - Config Service', () => {
    afterAll(async () => {
        const { Notification } = models;
        await Promise.all([Notification.deleteMany({})]);
    });

    beforeEach(async () => {
        const { Notification } = models;
        await Promise.all([Notification.deleteMany({})]);
        await Notification.insertMany([
            newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", read: false }], { urlFile: "URL_BLOB_STORAGE" }),
            newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", read: true }], { urlFile: "URL_BLOB_STORAGE" }),
            newNotification("orders.export.csv",[{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", read: false },{ user:"bc4bb42c-ad24-40e3-acaa-0d0fca3e173A", read: false }], { urlFile: "URL_BLOB_STORAGE" })
        ]);
    });

    describe('List Notifications', () => {
        it('should return a list of notifications filtered by UserId', async () => {
            const service = new NotificationService();
            const response = await service.listNotifications("bc4bb42c-ad24-40e3-acaa-0d0fca3e173e", {}, fields, paginationParams)
            console.log(response)
        });
    });
});
