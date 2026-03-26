import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果已经是有 code 和 message 的响应，直接返回
        if (data && typeof data === 'object' && 'code' in data) {
          return data;
        }
        return {
          code: 200,
          message: 'success',
          data,
        };
      }),
    );
  }
}
