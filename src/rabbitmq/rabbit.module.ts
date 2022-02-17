import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@infralabs/infra-logger';
import { Module, Scope } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Env } from '../commons/environment/env';
import { NestjsLogger } from '../commons/providers/log/nestjs-logger';
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
    ]),
  ],
  providers: [
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
    ConsumerOrderController,
    OrderService,
  ],
  controllers: [],
  exports: [RabbitMQModule],
})
export class RabbitMqModule {}
