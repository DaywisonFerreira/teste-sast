import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaModule } from '@infralabs/infra-nestjs-kafka';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { Env } from './commons/environment/env';
import { OrderModule } from './order/order.module';
import { IntelipostModule } from './intelipost/intelipost.module';
import { CarrierModule } from './carrier/carrier.module';
import { AccountModule } from './account/account.module';
import { InvoiceModule } from './invoice/invoice.module';
import { DefaultExceptionsFilter } from './commons/filters/default-exception.filter';
import { StatusCodeModule } from './status-code/status-code.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ShipmentModule } from './shipment/shipment.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(
      'mongodb+srv://johan:teste123@cluster0.vb6mt.mongodb.net/test',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
      },
    ),
    EventEmitterModule.forRoot(),
    KafkaModule.forRoot({
      name: 'KafkaService',
      options: {
        client: {
          clientId: Env.KAFKA_CLIENT_ID,
          brokers:
            Env.KAFKA_URIS && Array.isArray(Env.KAFKA_URIS.split(','))
              ? Env.KAFKA_URIS.split(',')
              : [],
        },
        consumer: {
          groupId: Env.KAFKA_GROUP_ID,
        },
        run: {
          autoCommit: false,
        },
      },
    }),
    OrderModule,
    IntelipostModule,
    CarrierModule,
    AccountModule,
    InvoiceModule,
    JobsModule,
    StatusCodeModule,
    SchedulerModule,
    ShipmentModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DefaultExceptionsFilter,
    },
  ],
})
export class AppModule {}
