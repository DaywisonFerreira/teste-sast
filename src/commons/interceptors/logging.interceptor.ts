import { ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { LogService, RequestInterceptor } from '@infralabs/infra-logger';
import { NestjsLogger } from '../providers/log/nestjs-logger';
import { Env } from '../environment/env';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: any): any {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    return RequestInterceptor.intercept(
      request,
      response,
      next,
      Env.NODE_ENV === 'local' ? NestjsLogger : LogService,
    );
  }
}
