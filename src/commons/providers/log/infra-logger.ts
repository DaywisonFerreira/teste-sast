import formatLoggerHelper from '@infralabs/infra-logger-nestjs';
import { Logger } from '@nestjs/common';
import { LogProvider } from './log-provider.interface';

export class InfraLogger implements LogProvider {
  private logger: Logger;

  instanceLogger(context: string) {
    this.logger = new Logger(context);
  }

  log(data: any, headers?: any): void {
    this.logger.log(formatLoggerHelper(data, headers || {}));
  }

  error(error: Error): void {
    this.logger.error(error.message, error.stack?.split('\n'));
  }

  debug(data: any, headers?: any): void {
    this.logger.debug(formatLoggerHelper(data, headers || {}));
  }
}
