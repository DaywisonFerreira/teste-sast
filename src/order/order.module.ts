import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

import {
  AccountEntity,
  AccountSchema,
} from 'src/account/schemas/account.schema';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderEntity, OrderSchema } from './schemas/order.schema';
import { ConsumerOrderController } from './consumer/order.controller';
import { UpdateStructureOrder } from './scripts/update-order-structure-json.service';
import { UpdateDuplicatedOrders } from './scripts/update-duplicated-orders.service';
import { UpdateHistoryOrders } from './scripts/update-history-orders.service';
import { HandleStatusCode } from './scripts/handle-status-code.service';
import { RabbitMqModule } from '../rabbitmq/rabbit.module';
import { NestjsEventEmitter } from '../commons/providers/event/nestjs-event-emitter';

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
    ]),
  ],
  controllers: [OrderController, ConsumerOrderController],
  providers: [
    OrderService,
    UpdateStructureOrder,
    UpdateDuplicatedOrders,
    UpdateHistoryOrders,
    HandleStatusCode,
    { provide: 'EventProvider', useClass: NestjsEventEmitter },
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
