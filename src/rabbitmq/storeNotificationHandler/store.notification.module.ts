import { Module } from '@nestjs/common';
import { StoreNotificationHandler } from './store.notification.service';
import { ConfigModule } from '../../config/config.module';
import { ConfigMapper } from '../../config/mappers/config.mapper';
import { ConfigService } from '../../config/config.service';

@Module({
  imports: [ConfigModule],
  providers: [StoreNotificationHandler, ConfigMapper, ConfigService],
})
export class StoreNotificationModule {}
