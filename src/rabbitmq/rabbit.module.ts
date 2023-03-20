import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AccountEntity,
  AccountSchema,
} from 'src/account/schemas/account.schema';
import { CarrierService } from 'src/carrier/carrier.service';
import {
  CarrierEntity,
  CarrierSchema,
} from 'src/carrier/schemas/carrier.schema';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { InvoiceService } from 'src/invoice/invoice.service';
import {
  InvoiceEntity,
  InvoiceSchema,
} from 'src/invoice/schemas/invoice.schema';
import { OrderProducer } from 'src/order/producer/order.producer';
import { AccountService } from '../account/account.service';

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
      {
        name: InvoiceEntity.name,
        schema: InvoiceSchema,
      },
      {
        name: CarrierEntity.name,
        schema: CarrierSchema,
      },
    ]),
  ],
  providers: [
    ConsumerOrderController,
    OrderService,
    CarrierService,
    InvoiceService,
    OrderProducer,
    AccountService,
    { provide: 'EventProvider', useClass: NestjsEventEmitter },
    {
      provide: 'LogProvider',
      useClass: InfraLogger,
    },
  ],
  controllers: [],
  exports: [RabbitMQModule],
})
export class RabbitMqModule {}
