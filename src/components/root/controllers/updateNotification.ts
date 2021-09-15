import { Response, helpers } from 'ihub-framework-ts';
import { LogService } from '@infralabs/infra-logger';

import { IRequest } from '../../../common/interfaces/request';

import { NotificationService } from '../services/notificationService';

const { HttpHelper } = helpers;

interface Params {
    allNotifications: Boolean,
    notificationId: string
}

export = async (req: IRequest, res: Response) => {
    const logger = new LogService();

    try {
        logger.startAt();

        const { userId } = req
        const notificationService = new NotificationService()

        const { allNotifications, notificationId }: Partial<Params> = req.query;

        if(!allNotifications && !notificationId){
            return HttpHelper.notFound(res, "Missing params \"all\" or \"notificationId\"");
        }

        if(allNotifications && notificationId){
            return HttpHelper.conflict(res, "Bad request only one of this params: \"all\" or\"notificationId\"");
        }

        await notificationService.markAsRead(userId, notificationId, allNotifications)

        logger.add('ifc.logistic.api.notification.updateNotification',
        allNotifications ? `Mark as READ all notifications, from user: ${userId}` : `Mark as READ notification: ${notificationId}, from user: ${userId}`)

        logger.endAt();
        await logger.sendLog();

        HttpHelper.ok(res);
    } catch (error) {
        logger.error(error);
        logger.endAt();
        await logger.sendLog();
        HttpHelper.fail(res, error);
    }
};
