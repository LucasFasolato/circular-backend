import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  hasResponseMeta,
  RESPONSE_META_KEY,
} from '../application/response-meta';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: Record<string, unknown>;
}

@Injectable()
export class SuccessResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (hasResponseMeta(data)) {
          const { [RESPONSE_META_KEY]: meta, ...payload } = data;

          return {
            success: true as const,
            data: payload as T,
            meta,
          };
        }

        return {
          success: true as const,
          data,
          meta: {},
        };
      }),
    );
  }
}
