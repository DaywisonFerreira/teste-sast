import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NestjsEventEmitter } from 'src/commons/providers/event/nestjs-event-emitter';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { AccountService } from '../account/account.service';
import {
  AccountEntity,
  AccountSchema,
} from '../account/schemas/account.schema';
import { OrderService } from '../order/order.service';
import { OrderEntity, OrderSchema } from '../order/schemas/order.schema';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccountEntity.name, schema: AccountSchema },
      { name: OrderEntity.name, schema: OrderSchema },
    ]),
  ],
  providers: [
    SchedulerService,
    AccountService,
    OrderService,
    NestjsEventEmitter,
    {
      provide: 'LogProvider',
      useClass: InfraLogger,
    },
  ],
})
export class SchedulerModule {}
