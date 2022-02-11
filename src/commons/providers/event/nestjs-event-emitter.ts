import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventProvider } from './nestjs-event-provider.interface';

@Injectable()
export class NestjsEventEmitter implements EventProvider {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent('ftp.sent')
  listentToEvent(msg: string) {
    console.log('Message Received: ', msg);
  }

  emit(eventListener: string, payload: any) {
    this.eventEmitter.emit(eventListener, payload);
  }
}
