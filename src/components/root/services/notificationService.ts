import { NotificationRepository } from '../repositories/notificationRepository';
import { BaseService } from '../../../common/services/baseService';
import { Notification } from '../../../common/interfaces/socket';
import { common } from 'ihub-framework-ts';

export class NotificationService extends BaseService<Notification, NotificationRepository> {
    constructor() {
        super(new NotificationRepository());
    }

    async listNotifications(userId: string, { read }: any, fields: any, paginationParams: common.Types.PaginationParams){
        const today = new Date()
        const conditions: any = {}

        if(read){
            conditions['notifiedUsers'] = read === 'false' ?
                { $elemMatch: { user: userId, read: false } } : { $elemMatch: { user: userId, read: true } }
        }else{
            conditions['notifiedUsers'] = { $elemMatch: { user: userId } }
        }

        conditions['createdAt'] = {
            $gte: new Date().setDate(today.getDate()-30)
        }

        const unreadCount = await this.repository.countDocuments({ notifiedUsers: { $elemMatch: { user: userId, read: false } }, createdAt: { $gte: new Date().setDate(today.getDate()-30) }});
        const toFormat = await this.repository.pagination(conditions, fields, { lean: true }, {...paginationParams, orderBy: 'createdAt', orderDirection: 'desc'});

        const result = {
            ...toFormat,
            data: toFormat.data.map(notification => {
                const { _id, notificationType, payload, createdAt, notifiedUsers } = notification
                return {
                    _id, notificationType, createdAt,
                    payload: payload ? JSON.parse(payload) : {},
                    read: notifiedUsers.find(notify => notify.user === userId).read
                }
            })}

        return {...result, unreadCount }
    }

    async save(data: Partial<Notification>): Promise<void>{
        if(data.payload){
            data.payload = JSON.stringify(data.payload)
        }
        await this.repository.save(data as Notification)
    }

    async markAsRead(userId: string, notificationId?: string, markAll?: any){
        const update = { $set: { "notifiedUsers.$.read": true } };

        if(markAll === 'true'){
            return await this.repository.updateMany({ notifiedUsers: { $elemMatch: { user: userId }}}, update)
        }

        return await this.repository.findOneAndUpdate({ _id: notificationId, notifiedUsers: { $elemMatch: { user: userId }}}, update);
    }
}
