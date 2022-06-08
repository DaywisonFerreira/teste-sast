import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AccountEntity,
  AccountSchema,
} from 'src/account/schemas/account.schema';

import { Env } from '../commons/environment/env';
import { NestjsEventEmitter } from '../commons/providers/event/nestjs-event-emitter';
import { ConsumerOrderController } from '../order/consumer/order.controller';
import { OrderService } from '../order/order.service';
import { OrderEntity, OrderSchema } from '../order/schemas/order.schema';

@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: Env.RABBITMQ_ORDER_NOTIFICATION_EXCHANGE,
          type: 'fanout',
        },
      ],
      uri: Env.RABBITMQ_URI,
      prefetchCount: Env.RABBITMQ_PREFETCH,
      connectionInitOptions: { wait: true },
    }),
    MongooseModule.forFeature([
      {
        name: OrderEntity.name,
        schema: OrderSchema,
      },
      {
        name: AccountEntity.name,
        schema: AccountSchema,
      },
    ]),
  ],
  providers: [
    ConsumerOrderController,
    OrderService,
    { provide: 'EventProvider', useClass: NestjsEventEmitter },
  ],
  controllers: [],
  exports: [RabbitMQModule],
})
export class RabbitMqModule {}
