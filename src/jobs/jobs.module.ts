import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarrierService } from 'src/carrier/carrier.service';
import {
  CarrierEntity,
  CarrierSchema,
} from 'src/carrier/schemas/carrier.schema';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { InvoiceService } from 'src/invoice/invoice.service';
import {
  InvoiceEntity,
  InvoiceSchema,
} from 'src/invoice/schemas/invoice.schema';
import { JobsController } from './jobs.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarrierEntity.name, schema: CarrierSchema },
      { name: InvoiceEntity.name, schema: InvoiceSchema },
    ]),
  ],
  controllers: [JobsController],
  providers: [
    {
      provide: 'LogProvider',
      useClass: InfraLogger,
    },
    InvoiceService,
    CarrierService,
  ],
})
export class JobsModule {}
