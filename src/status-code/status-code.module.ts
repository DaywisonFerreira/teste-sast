import { MongooseModule } from '@nestjs/mongoose';
import { Module, Scope } from '@nestjs/common';
import { Env } from 'src/commons/environment/env';
import { NestjsLogger } from 'src/commons/providers/log/nestjs-logger';
import { InfraLogger as Logger } from '@infralabs/infra-logger';
import { StatusCodeService } from './status-code.service';
import { StatusCodeController } from './status-code.controller';
import {
  StatusCodeEntity,
  StatusCodeSchema,
} from './schemas/status-code.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: StatusCodeEntity.name,
        schema: StatusCodeSchema,
      },
    ]),
  ],
  controllers: [StatusCodeController],
  providers: [
    {
      provide: 'LogProvider',
      useClass: Env.NODE_ENV === 'local' ? NestjsLogger : Logger,
      scope: Scope.TRANSIENT,
    },
    StatusCodeService,
  ],
  exports: [
    MongooseModule.forFeature([
      {
        name: StatusCodeEntity.name,
        schema: StatusCodeSchema,
      },
    ]),
  ],
})
export class StatusCodeModule {}
