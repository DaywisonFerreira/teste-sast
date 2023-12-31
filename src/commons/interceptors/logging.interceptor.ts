import { ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import {
  RequestLoggerInterceptor,
  TransformInterceptor,
} from '@infralabs/infra-logger';
import { catchError, map } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: any): any {
    if (typeof context.switchToHttp().getRequest().headers === 'object') {
      const response = context.switchToHttp().getResponse();
      const logger = new RequestLoggerInterceptor();
      const handler = logger.intercept(context, next);

      const transformInterceptor = new TransformInterceptor();

      return handler.pipe(
        map(data => transformInterceptor.transformResponse(data, response)),
        catchError(error => transformInterceptor.transformError(error) as any),
      );
    }

    return next.handle();
  }
}
