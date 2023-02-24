import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NestjsEventEmitter } from 'src/commons/providers/event/nestjs-event-emitter';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { OrderModule } from 'src/order/order.module';
import { AccountService } from '../account/account.service';
import {
  AccountEntity,
  AccountSchema,
} from '../account/schemas/account.schema';
import { OrderEntity, OrderSchema } from '../order/schemas/order.schema';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    OrderModule,
    MongooseModule.forFeature([
      { name: AccountEntity.name, schema: AccountSchema },
      { name: OrderEntity.name, schema: OrderSchema },
    ]),
  ],
  providers: [
    SchedulerService,
    AccountService,
    NestjsEventEmitter,
    {
      provide: 'LogProvider',
      useClass: InfraLogger,
    },
  ],
})
export class SchedulerModule {}
