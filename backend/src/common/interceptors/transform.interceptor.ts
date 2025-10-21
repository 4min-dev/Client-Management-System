import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getClass().name == 'StorageController') {
      return next.handle();
    }

    return next.handle().pipe(map((data) => ({ isSuccess: true, data: data })));
  }
}
