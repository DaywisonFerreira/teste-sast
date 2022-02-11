import { Module } from '@nestjs/common';
import { SellerNotificationHandler } from './seller.notification.service';
import { ConfigModule } from '../../config/config.module';
import { ConfigMapper } from '../../config/mappers/config.mapper';
import { ConfigService } from '../../config/config.service';

@Module({
  imports: [ConfigModule],
  providers: [SellerNotificationHandler, ConfigMapper, ConfigService],
})
export class SellerNotificationModule {}
