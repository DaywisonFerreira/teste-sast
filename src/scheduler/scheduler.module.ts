import { Module } from '@nestjs/common';
import { NestjsEventEmitter } from 'src/commons/providers/event/nestjs-event-emitter';
import { InfraLogger } from 'src/commons/providers/log/infra-logger';
import { SchedulerService } from './scheduler.service';

@Module({
  providers: [
    SchedulerService,
    NestjsEventEmitter,
    {
      provide: 'LogProvider',
      useClass: InfraLogger,
    },
  ],
})
export class SchedulerModule {}
