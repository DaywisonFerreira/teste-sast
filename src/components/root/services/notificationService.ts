import { NotificationRepository } from '../repositories/notificationRepository';
import { BaseService } from '../../../common/services/baseService';
import { Notification } from '../../../common/interfaces/socket';
import { common } from 'ihub-framework-ts';

export class NotificationService extends BaseService<Notification, NotificationRepository> {
    constructor() {
        super(new NotificationRepository());
    }

    async listNotifications(user: string, { read }: any, fields: any, paginationParams: common.Types.PaginationParams){
        const today = new Date();
        const conditions: any = {
            createdAt: { $gte: new Date().setDate(today.getDate()-30) }
        }

        if(read){
            conditions['notifiedUsers'] = read === 'false' ?
                { $elemMatch: { user, read: false } } : { $elemMatch: { user, read: true } }
        }else{
            conditions['notifiedUsers'] = { $elemMatch: { user } }
        }

        const unreadCount = await this.repository.countDocuments({ notifiedUsers: { $elemMatch: { user, read: false } }, createdAt: { $gte: new Date().setDate(today.getDate()-30) }});
        const toFormat = await this.repository.pagination(conditions, fields, { lean: true }, {...paginationParams, orderBy: 'createdAt', orderDirection: 'desc'});

        const result = {
            ...toFormat,
            data: toFormat.data.map(notification => {
                const { _id, notificationType, payload, createdAt, notifiedUsers } = notification
                return {
                    _id, notificationType, createdAt,
                    payload: payload ? JSON.parse(payload) : {},
                    read: notifiedUsers.find(notify => notify.user === user).read
                }
            })}

        return {...result, unreadCount }
    }

    async save(data: Partial<Notification>): Promise<Notification>{
        if(data.payload){
            data.payload = JSON.stringify(data.payload)
        }
        return await this.repository.save(data as Notification)
    }

    async markAsRead(user: string, notificationId?: string, markAll?: any){
        if(!markAll && notificationId){
            const notification = await this.repository.findOne({ _id: notificationId, notifiedUsers: { $elemMatch: { user }}}, { 'notifiedUsers.$': 1 })
            const [status] = notification.notifiedUsers
            return await this.repository.findOneAndUpdate({ _id: notificationId, notifiedUsers: { $elemMatch: { user }}}, { $set: { "notifiedUsers.$.read": !status.read } }, { new: true })
        }

        if(markAll && !notificationId){
            const today = new Date();
            const conditions = { createdAt: { $gte: new Date().setDate(today.getDate()-30) }, notifiedUsers: { $elemMatch: { user }}}
            const status = markAll === 'true' ? true : false
            return await this.repository.updateMany(conditions, { $set: { "notifiedUsers.$.read": status } })
        }
    }
}
