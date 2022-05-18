import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderEntity, OrderSchema } from './schemas/order.schema';
import { ConsumerOrderController } from './consumer/order.controller';
import { UpdateStructureOrder } from './scripts/update-order-structure-json.service';
import { UpdateDuplicatedOrders } from './scripts/update-duplicated-orders.service';
import { HandleStatusCode } from './scripts/handle-status-code.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: OrderEntity.name,
        schema: OrderSchema,
      },
    ]),
  ],
  controllers: [OrderController, ConsumerOrderController],
  providers: [
    OrderService,
    UpdateStructureOrder,
    UpdateDuplicatedOrders,
    HandleStatusCode,
  ],
  exports: [
    MongooseModule.forFeature([
      {
        name: OrderEntity.name,
        schema: OrderSchema,
      },
    ]),
  ],
})
export class OrderModule {}
