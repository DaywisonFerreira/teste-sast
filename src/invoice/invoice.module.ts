import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AccountService } from 'src/account/account.service';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { NestjsEventEmitter } from '../commons/providers/event/nestjs-event-emitter';

import {
  CarrierEntity,
  CarrierSchema,
} from '../carrier/schemas/carrier.schema';
import {
  AccountEntity,
  AccountSchema,
} from '../account/schemas/account.schema';
import { InvoiceService } from './invoice.service';
import { ConsumerInvoiceController } from './consumer/invoice.controller';
import { CarrierService } from '../carrier/carrier.service';
import { OrderModule } from '../order/order.module';
import { CarrierModule } from '../carrier/carrier.module';
import { InvoiceEntity, InvoiceSchema } from './schemas/invoice.schema';
import { InvoiceController } from './invoice.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarrierEntity.name, schema: CarrierSchema },
      { name: InvoiceEntity.name, schema: InvoiceSchema },
      { name: AccountEntity.name, schema: AccountSchema },
    ]),
    OrderModule,
    CarrierModule,
  ],
  controllers: [ConsumerInvoiceController, InvoiceController],
  providers: [
    {
      provide: 'LogProvider',
      useClass: InfraLogger,
    },
    NestjsEventEmitter,
    InvoiceService,
    CarrierService,
    AccountService,
  ],
})
export class InvoiceModule {}
