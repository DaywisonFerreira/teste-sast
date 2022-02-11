import { Inject, Injectable } from '@nestjs/common';
import { LogProvider } from '@infralabs/infra-logger';
import { InjectModel } from '@nestjs/mongoose';
import { WebSocketServer } from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Server } from 'socket.io';
import { INotificationPayload } from '../notification/interfaces/notification-payload.interface';
import {
  NotificationDocument,
  NotificationEntity,
} from '../notification/schemas/notification.schema';

@Injectable()
export class SocketService {
  constructor(
    @InjectModel(NotificationEntity.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @Inject('LogProvider') private logger: LogProvider,
  ) {
    this.logger.context = SocketService.name;
  }

  @WebSocketServer() server: Server;

  private mapNotificationToClient(notification: NotificationEntity) {
    const { _id, type, origin, payload, createdAt } = notification;

    return {
      _id,
      type,
      origin,
      payload: payload ? JSON.parse(payload) : {},
      createdAt,
      read: false,
    };
  }

  private async saveNotification(
    data: NotificationDocument,
  ): Promise<NotificationEntity> {
    if (data?.payload) {
      // eslint-disable-next-line no-param-reassign
      data.payload = JSON.stringify(data.payload);
    }
    // eslint-disable-next-line new-cap
    const notificationToSave = new this.notificationModel(data);
    const notificationSaved = await notificationToSave.save();
    return notificationSaved;
  }

  async sendMessage(userId: string, data: INotificationPayload): Promise<void> {
    try {
      const notificationToMap = await this.saveNotification({
        ...data,
        notifiedUsers: [{ user: userId, read: false }],
      } as NotificationDocument);

      const notificationMapped =
        this.mapNotificationToClient(notificationToMap);

      this.server.in(userId).emit('notification', notificationMapped);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
