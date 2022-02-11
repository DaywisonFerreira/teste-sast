import { Module, Scope } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Logger } from '@infralabs/infra-logger';
import {
  NotificationEntity,
  NotificationSchema,
} from '../notification/schemas/notification.schema';
import { JWT } from '../commons/utils/jwt.utils';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { Env } from '../commons/environment/env';
import { NestjsLogger } from '../commons/providers/log/nestjs-logger';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationEntity.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [],
  providers: [
    SocketGateway,
    JWT,
    SocketService,
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
  ],
  exports: [SocketService],
})
export class SocketModule {}
