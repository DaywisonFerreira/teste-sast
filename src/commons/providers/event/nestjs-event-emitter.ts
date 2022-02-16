import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventProvider } from './nestjs-event-provider.interface';

@Injectable()
export class NestjsEventEmitter implements EventProvider {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emit(eventListener: string, payload: any) {
    this.eventEmitter.emit(eventListener, payload);
  }
}
