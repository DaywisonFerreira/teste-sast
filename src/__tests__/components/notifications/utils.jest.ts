import { NotifiedUsers } from '../../../common/interfaces/socket'

export function newNotification(type:string, notifiedUsers: NotifiedUsers[], payload?: any,): any {
    return {
        "notificationType": type,
        "notifiedUsers": notifiedUsers,
        "payload": JSON.stringify({ payload })
    };
}
