import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaModule } from '@infralabs/infra-nestjs-kafka';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { Env } from './commons/environment/env';
import { OrderModule } from './order/order.module';
import { IntelipostModule } from './intelipost/intelipost.module';
import { NotificationModule } from './notification/notification.module';
import { CarrierModule } from './carrier/carrier.module';
import { AccountModule } from './account/account.module';
import { InvoiceModule } from './invoice/invoice.module';

@Module({
  imports: [
    MongooseModule.forRoot(Env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    }),
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
    NotificationModule,
    CarrierModule,
    AccountModule,
    InvoiceModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
