import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';

export const getCacheConfig = (
  configService: ConfigService,
): {
  store: typeof redisStore;
  host: string;
  port: number;
  ttl: number;
} => ({
  store: redisStore,
  host:
    process.env.NODE_ENV === 'development'
      ? configService.get<string>('REDIS_HOST_DEV', 'localhost')
      : configService.get<string>('REDIS_HOST', 'redis'),
  port: configService.get<number>('REDIS_PORT', 6379),
  ttl: 600,
});
