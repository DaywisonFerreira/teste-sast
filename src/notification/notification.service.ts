import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IFilterObject } from 'src/commons/interfaces/filter-object.interface';
import {
  NotificationDocument,
  NotificationEntity,
} from './schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(NotificationEntity.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async listByUser(
    user: string,
    page: number,
    pageSize: number,
    read?: string,
  ): Promise<[NotificationEntity[], number, number]> {
    const today = new Date();
    const filter: IFilterObject = {
      createdAt: { $gte: new Date().setDate(today.getDate() - 30) },
      notifiedUsers: { $elemMatch: { user } },
    };

    if (typeof read !== 'undefined') {
      filter.notifiedUsers =
        read === 'true'
          ? { $elemMatch: { user, read: true } }
          : { $elemMatch: { user, read: false } };
    }

    const filterUnread: IFilterObject = {
      notifiedUsers: { $elemMatch: { user, read: false } },
      createdAt: { $gte: new Date().setDate(today.getDate() - 30) },
    };

    const count = await this.notificationModel.countDocuments(filter);
    const unreadCount = await this.notificationModel.countDocuments(
      filterUnread,
    );
    const result = await this.notificationModel
      .find(filter)
      .limit(pageSize)
      .skip(pageSize * page)
      .sort({ createdAt: 'desc' });

    return [result, count, unreadCount];
  }

  async markAsRead(
    user: string,
    all?: string,
    notificationId?: string,
  ): Promise<void> {
    if (!all && notificationId) {
      const notification = await this.notificationModel.findOne(
        { _id: notificationId, notifiedUsers: { $elemMatch: { user } } },
        { 'notifiedUsers.$': 1 },
      );
      const [status] = notification.notifiedUsers;
      await this.notificationModel.findOneAndUpdate(
        { _id: notificationId, notifiedUsers: { $elemMatch: { user } } },
        { $set: { 'notifiedUsers.$.read': !status.read } },
        { new: true },
      );
    }

    if (all && !notificationId) {
      const today = new Date();
      const conditions: IFilterObject = {
        createdAt: { $gte: new Date().setDate(today.getDate() - 30) },
        notifiedUsers: { $elemMatch: { user } },
      };
      const status = all === 'true';
      await this.notificationModel.updateMany(conditions, {
        $set: { 'notifiedUsers.$.read': status },
      });
    }
  }
}
