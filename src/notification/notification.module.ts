import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import {
  NotificationEntity,
  NotificationSchema,
} from './schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationEntity.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [
    MongooseModule.forFeature([
      { name: NotificationEntity.name, schema: NotificationSchema },
    ]),
  ],
})
export class NotificationModule {}
