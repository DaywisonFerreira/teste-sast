import { Module, Scope } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Logger } from '@infralabs/infra-logger';
import { RabbitMqModule } from '../rabbitmq/rabbit.module';
import { InteliPostService } from './intelipost.service';
import { InteliPostController } from './intelipost.controller';
import { OrderEntity, OrderSchema } from '../order/schemas/order.schema';
import { NestjsLogger } from '../commons/providers/log/nestjs-logger';
import { Env } from '../commons/environment/env';
import { OrderService } from '../order/order.service';
import { ConsumerContractController } from './consumer/intelipost.controller';
import { IntelipostMapper } from './mappers/intelipostMapper';

@Module({
  imports: [
    RabbitMqModule,
    MongooseModule.forFeature([
      {
        name: OrderEntity.name,
        schema: OrderSchema,
      },
    ]),
  ],
  controllers: [InteliPostController, ConsumerContractController],
  providers: [
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
    InteliPostService,
    OrderService,
    IntelipostMapper,
  ],
})
export class IntelipostModule {}
