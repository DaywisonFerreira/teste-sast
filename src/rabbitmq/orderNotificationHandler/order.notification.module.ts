import { Module, Scope } from '@nestjs/common';
import { OrderService } from 'src/order/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderEntity, OrderSchema } from 'src/order/schemas/order.schema';
import { Logger } from '@infralabs/infra-logger';
import { NestjsLogger } from 'src/commons/providers/log/nestjs-logger';
import { Env } from 'src/commons/environment/env';
import { OrderNotificationHandler } from './order.notification.service';
import { ConfigModule } from '../../config/config.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: OrderEntity.name,
        schema: OrderSchema,
      },
    ]),
  ],
  providers: [
    OrderNotificationHandler,
    OrderService,
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
  ],
})
export class OrderNotificationModule {}
