import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLogger } from './AppLogger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const logger = new AppLogger(context.getClass().name);

    if (context.getType() === 'http') {
      // do something that is only important in the context of regular HTTP requests (REST)
      const request: Request = context.getArgByIndex(0);

      logger.logRequest(request, context.getHandler().name);
    }

    return next
      .handle()
      .pipe(
        tap(() =>
          logger.traceRequest(
            context.getArgByIndex(0),
            context.getHandler().name,
            Date.now() - startTime,
          ),
        ),
      );
  }
}
