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
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { CarrierService } from '../carrier/carrier.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarrierEntity.name, schema: CarrierSchema },
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
  ],
})
export class InvoiceModule {}
