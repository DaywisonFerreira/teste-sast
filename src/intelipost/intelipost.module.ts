import { Module, Scope } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InfraLogger as Logger } from '@infralabs/infra-logger';

import { NestjsLogger } from '../commons/providers/log/nestjs-logger';
import { Env } from '../commons/environment/env';
import { RabbitMqModule } from '../rabbitmq/rabbit.module';

import {
  CarrierEntity,
  CarrierSchema,
} from '../carrier/schemas/carrier.schema';
import {
  AccountEntity,
  AccountSchema,
} from '../account/schemas/account.schema';
import { OrderEntity, OrderSchema } from '../order/schemas/order.schema';
import { OrderService } from '../order/order.service';
import { CarrierService } from '../carrier/carrier.service';
import { AccountService } from '../account/account.service';
import { InteliPostService } from './intelipost.service';
import { IntelipostMapper } from './mappers/intelipostMapper';
import { ConsumerIntelipostController } from './consumer/intelipost.controller';
import { OnEventIntelipostController } from './consumer/intelipost-event.controller';
import { IntelipostController } from './intelipost.controller';

@Module({
  imports: [
    RabbitMqModule,
    MongooseModule.forFeature([
      { name: OrderEntity.name, schema: OrderSchema },
      { name: CarrierEntity.name, schema: CarrierSchema },
      { name: AccountEntity.name, schema: AccountSchema },
    ]),
  ],
  controllers: [
    IntelipostController,
    ConsumerIntelipostController,
    OnEventIntelipostController,
  ],
  providers: [
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
    InteliPostService,
    OrderService,
    IntelipostMapper,
    CarrierService,
    AccountService,
  ],
})
export class IntelipostModule {}
