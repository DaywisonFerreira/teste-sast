import { MongooseModule } from '@nestjs/mongoose';
import { Module, Scope } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';
import { NestjsLogger } from 'src/commons/providers/log/nestjs-logger';
import { InfraLogger as Logger } from '@infralabs/infra-logger';

import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderEntity, OrderSchema } from './schemas/order.schema';
import { ConsumerOrderController } from './consumer/order.controller';

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
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
    OrderService,
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
