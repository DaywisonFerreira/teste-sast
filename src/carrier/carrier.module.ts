import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { CnpjAlreadyExist, NameAlreadyExist } from './validators';
import { CarrierEntity, CarrierSchema } from './schemas/carrier.schema';
import { CarrierController } from './carrier.controller';
import { CarrierService } from './carrier.service';
import { ConsumerCarrierController } from './consumer/carrier.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarrierEntity.name, schema: CarrierSchema },
    ]),
  ],
  controllers: [CarrierController, ConsumerCarrierController],
  providers: [
    CarrierService,
    CnpjAlreadyExist,
    NameAlreadyExist,
    {
      provide: 'LogProvider',
      useClass: InfraLogger,
    },
  ],
  exports: [
    MongooseModule.forFeature([
      { name: CarrierEntity.name, schema: CarrierSchema },
    ]),
  ],
})
export class CarrierModule {}
