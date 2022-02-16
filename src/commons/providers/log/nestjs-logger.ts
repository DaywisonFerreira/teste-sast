import { Logger } from '@nestjs/common';
import { LogProvider } from '@infralabs/infra-logger';

export class NestjsLogger extends LogProvider {
  private logger: Logger;

  constructor(context) {
    super(context);
    this.logger = new Logger();
  }

  startAt() {
    // do something
  }

  endAt() {
    // do something
  }

  sendLog() {
    // do something
  }

  add(context, data): void {
    this.logger.log(JSON.stringify(data), context);
  }

  log(data): void {
    this.logger.log(data, this.context);
  }

  error(data: Error): void {
    this.logger.log(data, this.context);
  }

  debug(data): void {
    this.logger.log(data, this.context);
  }

  warn(data): void {
    this.logger.log(data, this.context);
  }
}
