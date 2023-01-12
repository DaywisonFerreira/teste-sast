import { Module } from '@nestjs/common';
import { NestjsEventEmitter } from 'src/commons/providers/event/nestjs-event-emitter';
import { SchedulerService } from './scheduler.service';

@Module({
  providers: [SchedulerService, NestjsEventEmitter],
})
export class SchedulerModule {}
