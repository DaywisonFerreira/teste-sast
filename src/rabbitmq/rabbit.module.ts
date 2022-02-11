import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';

import { OrderNotificationModule } from './orderNotificationHandler/order.notification.module';
import { SellerNotificationModule } from './sellerNotificationHandler/seller.notification.module';
import { StoreNotificationModule } from './storeNotificationHandler/store.notification.module';

@Module({
  imports: [
    OrderNotificationModule,
    SellerNotificationModule,
    StoreNotificationModule,
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: Env.STORE_NOTIFICATION_EXCHANGE,
          type: 'fanout',
        },
        {
          name: Env.SELLER_NOTIFICATION_EXCHANGE,
          type: 'fanout',
        },
        {
          name: Env.ORDER_NOTIFICATION_EXCHANGE,
          type: 'fanout',
        },
      ],
      uri: Env.RABBITMQ_URI,
      connectionInitOptions: { wait: true },
    }),
  ],
  providers: [],
  controllers: [],
  exports: [RabbitMQModule],
})
export class RabbitMqModule {}
