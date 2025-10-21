import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler, Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StationService } from '../../app/stations/station.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { getFuelsChangedEventKey, getOptionsChangedEventKey } from '../../app/stations/utils/cacheKeys';

@Injectable()
export class StationSyncInterceptor implements NestInterceptor {
  constructor(private stationService: StationService, @Inject(CACHE_MANAGER) private cacheManager: Cache) {
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    if (context.getClass().name == 'StorageController') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    if (request.url.indexOf('synchronize') == -1) {
      return next.handle();
    }

    const stationId = request.params?.stationId;

    if (!stationId) {
      return next.handle();
    }

    return next.handle().pipe(map(async (data) => {
      const isKeyExpired = await this.stationService.isKeyExpired(stationId);
      const isOptionsChanged = await this.cacheManager.get<boolean>(getOptionsChangedEventKey(stationId)) ?? false;
      const isFuelsChanged = await this.cacheManager.get<boolean>(getFuelsChangedEventKey(stationId)) ?? false;

      return {
        metadata: {
          needUpdate: {
            key: isKeyExpired,
            fuels: isFuelsChanged,
            options: isOptionsChanged,
          },
        }, ...data,
      };
    }));
  }
}
