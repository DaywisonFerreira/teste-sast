import { models } from 'ihub-framework-ts';
import { BaseRepository } from '../../../common/repositories/baseRepository';
import { Notification } from '../../../common/interfaces/socket';

export class NotificationRepository extends BaseRepository<Notification> {
    constructor() {
        super(models.Notification);
    }
}
