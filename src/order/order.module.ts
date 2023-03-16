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
import { AccountService } from '../account/account.service';
import { NestjsEventEmitter } from '../commons/providers/event/nestjs-event-emitter';
import { RabbitMqModule } from '../rabbitmq/rabbit.module';
import { ConsumerOrderController } from './consumer/order.controller';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderProducer } from './producer/order.producer';
import { OrderEntity, OrderSchema } from './schemas/order.schema';
import { HandleStatusCode } from './scripts/handle-status-code.service';
import { UpdateDuplicatedOrders } from './scripts/update-duplicated-orders.service';
import { UpdateHistoryOrders } from './scripts/update-history-orders.service';
import { UpdateStructureOrder } from './scripts/update-order-structure-json.service';

@Module({
  imports: [
    RabbitMqModule,
    MongooseModule.forFeature([
      {
        name: OrderEntity.name,
        schema: OrderSchema,
      },
      {
        name: AccountEntity.name,
        schema: AccountSchema,
      },
      { name: InvoiceEntity.name, schema: InvoiceSchema },
      { name: CarrierEntity.name, schema: CarrierSchema },
    ]),
  ],
  controllers: [OrderController, ConsumerOrderController],
  providers: [
    AccountService,
    InvoiceService,
    CarrierService,
    OrderService,
    OrderProducer,
    UpdateStructureOrder,
    UpdateDuplicatedOrders,
    UpdateHistoryOrders,
    HandleStatusCode,
    { provide: 'EventProvider', useClass: NestjsEventEmitter },
    {
      provide: 'LogProvider',
      useClass: InfraLogger,
    },
  ],
  exports: [
    MongooseModule.forFeature([
      {
        name: OrderEntity.name,
        schema: OrderSchema,
      },
    ]),
    OrderService,
  ],
})
export class OrderModule {}
