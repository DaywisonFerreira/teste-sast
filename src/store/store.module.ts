import { Module, Scope } from '@nestjs/common';
import { Logger } from '@infralabs/infra-logger';
import { MongooseModule } from '@nestjs/mongoose';
import { NestjsLogger } from '../commons/providers/log/nestjs-logger';
import { StoreService } from './store.service';
import { Env } from '../commons/environment/env';
import { StoreController } from './store.controller';
import { StoreEntity, StoreSchema } from './schemas/store.schema';
import { OrderEntity, OrderSchema } from '../order/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: StoreEntity.name,
        schema: StoreSchema,
      },
      {
        name: OrderEntity.name,
        schema: OrderSchema,
      },
    ]),
  ],
  controllers: [StoreController],
  providers: [
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
    StoreService,
  ],
})
export class StoresModule {}
