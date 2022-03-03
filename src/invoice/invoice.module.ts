import { Module, Scope } from '@nestjs/common';
import { Logger } from '@infralabs/infra-logger';
import { MongooseModule } from '@nestjs/mongoose';

import { NestjsEventEmitter } from '../commons/providers/event/nestjs-event-emitter';
import { Env } from '../commons/environment/env';
import { NestjsLogger } from '../commons/providers/log/nestjs-logger';

import {
  CarrierEntity,
  CarrierSchema,
} from '../carrier/schemas/carrier.schema';
import {
  TrackingCodeEntity,
  TrackingCodeSchema,
} from './schemas/tracking-code.schema';
import {
  AccountEntity,
  AccountSchema,
} from '../account/schemas/account.schema';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { ConfigMapper } from './mappers/config.mapper';
import { CarrierService } from '../carrier/carrier.service';
import { AccountService } from '../account/account.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarrierEntity.name, schema: CarrierSchema },
    ]),
    MongooseModule.forFeature([
      { name: AccountEntity.name, schema: AccountSchema },
    ]),
    MongooseModule.forFeature([
      { name: TrackingCodeEntity.name, schema: TrackingCodeSchema },
    ]),
  ],
  controllers: [InvoiceController],
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
    ConfigMapper,
  ],
})
export class InvoiceModule {}
