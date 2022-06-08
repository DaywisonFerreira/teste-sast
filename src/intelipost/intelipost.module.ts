import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

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
import { InvoiceService } from '../invoice/invoice.service';
import {
  InvoiceEntity,
  InvoiceSchema,
} from '../invoice/schemas/invoice.schema';

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
    InteliPostService,
    OrderService,
    IntelipostMapper,
    CarrierService,
    AccountService,
    InvoiceService,
  ],
})
export class IntelipostModule {}
