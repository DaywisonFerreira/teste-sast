import { Response, helpers } from 'ihub-framework-ts';
import { IRequest } from '../../../common/interfaces/request';
import { NotificationService } from '../services/notificationService';

const { PaginationHelper, HttpHelper } = helpers;

export default async (req: IRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req
        const { read } = req.query;

        const notificationService = new NotificationService()

        const paginationParams = PaginationHelper.createPaginationParams(
            req,
            ['createdAt']
        );

        const fields = {
            notificationType: 1,
            payload: 1,
            createdAt: 1,
            'notifiedUsers.$': 1,
            _id: 1
        }

        const paginatedResponse = await notificationService.listNotifications(userId, { read }, fields, paginationParams);

        HttpHelper.ok(
            res,
            paginatedResponse
        );
    } catch (error) {
        HttpHelper.fail(res, error);
    }
};
