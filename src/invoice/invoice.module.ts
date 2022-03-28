import { Module, Scope } from '@nestjs/common';
import { InfraLogger as Logger } from '@infralabs/infra-logger';
import { MongooseModule } from '@nestjs/mongoose';

import { AccountService } from 'src/account/account.service';
import { NestjsEventEmitter } from '../commons/providers/event/nestjs-event-emitter';
import { Env } from '../commons/environment/env';
import { NestjsLogger } from '../commons/providers/log/nestjs-logger';

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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarrierEntity.name, schema: CarrierSchema },
    ]),
    MongooseModule.forFeature([
      { name: AccountEntity.name, schema: AccountSchema },
    ]),
  ],
  controllers: [ConsumerInvoiceController],
  providers: [
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
    NestjsEventEmitter,
    InvoiceService,
    CarrierService,
    AccountService,
  ],
})
export class InvoiceModule {}
