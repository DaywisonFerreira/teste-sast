import { Module, Scope } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InfraLogger as Logger } from '@infralabs/infra-logger';
import { CnpjAlreadyExist, NameAlreadyExist } from './validators';
import { CarrierEntity, CarrierSchema } from './schemas/carrier.schema';
import { CarrierController } from './carrier.controller';
import { CarrierService } from './carrier.service';
import { Env } from '../commons/environment/env';
import { NestjsLogger } from '../commons/providers/log/nestjs-logger';
import { ConsumerCarrierController } from './consumer/carrier.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarrierEntity.name, schema: CarrierSchema },
    ]),
  ],
  controllers: [CarrierController, ConsumerCarrierController],
  providers: [
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
    CarrierService,
    CnpjAlreadyExist,
    NameAlreadyExist,
  ],
  exports: [
    MongooseModule.forFeature([
      { name: CarrierEntity.name, schema: CarrierSchema },
    ]),
  ],
})
export class CarrierModule {}
