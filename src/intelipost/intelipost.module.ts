import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { OrderProducer } from 'src/order/producer/order.producer';

import { AccountService } from '../account/account.service';
import {
  AccountEntity,
  AccountSchema,
} from '../account/schemas/account.schema';
import { CarrierService } from '../carrier/carrier.service';
import {
  CarrierEntity,
  CarrierSchema,
} from '../carrier/schemas/carrier.schema';
import { IntelipostApiGateway } from '../commons/providers/api/intelipost-api-gateway';
import { InvoiceService } from '../invoice/invoice.service';
import {
  InvoiceEntity,
  InvoiceSchema,
} from '../invoice/schemas/invoice.schema';
import { OrderService } from '../order/order.service';
import { OrderEntity, OrderSchema } from '../order/schemas/order.schema';
import { RabbitMqModule } from '../rabbitmq/rabbit.module';
import { OnEventIntelipostController } from './consumer/intelipost-event.controller';
import { ConsumerIntelipostController } from './consumer/intelipost.controller';
import { IntelipostController } from './intelipost.controller';
import { InteliPostService } from './intelipost.service';
import { IntelipostMapper } from './mappers/intelipostMapper';

@Module({
  imports: [
    RabbitMqModule,
    MongooseModule.forFeature([
      { name: OrderEntity.name, schema: OrderSchema },
      { name: CarrierEntity.name, schema: CarrierSchema },
      { name: AccountEntity.name, schema: AccountSchema },
      { name: InvoiceEntity.name, schema: InvoiceSchema },
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
      useClass: InfraLogger,
    },
    InteliPostService,
    OrderService,
    OrderProducer,
    IntelipostMapper,
    CarrierService,
    AccountService,
    InvoiceService,
    {
      provide: 'ApiGateway',
      useClass: IntelipostApiGateway,
    },
  ],
})
export class IntelipostModule {}
