import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

export const getCacheConfig = (
  configService: ConfigService,
): {
  store: typeof redisStore;
  host: string;
  port: number;
  ttl: number;
  redisInstance?: Redis;
  options?: Record<string, any>;
} => {
  const nodeEnv = configService.get<string>('NODE_ENV');
  const isTest = nodeEnv === 'test';
  const redisHost = isTest
    ? configService.get<string>('REDIS_HOST_TEST', 'localhost')
    : process.env.NODE_ENV === 'development'
      ? configService.get<string>('REDIS_HOST_DEV', 'localhost')
      : configService.get<string>('REDIS_HOST', 'redis');

  const logger = new Logger('RedisCache');

  const redisClient = new Redis({
    host: redisHost,
    port: configService.get<number>('REDIS_PORT', 6379),
    db: isTest ? 1 : 0,
  });

  redisClient.on('command', (command) => {
    logger.log(`Redis Command: ${command.name} ${command.args.join(' ')}`);
  });

  redisClient.on('error', (err) => {
    logger.error(`Redis Error: ${err.message}`, err.stack);
  });

  redisClient.on('connect', () => {
    logger.log('Connected to Redis');
  });

  redisClient.on('ready', () => {
    logger.log('Redis is ready');
  });

  return {
    store: redisStore,
    host: redisHost,
    port: configService.get<number>('REDIS_PORT', 6379),
    ttl: 1, // Default TTL
    redisInstance: redisClient, // Attach custom Redis client
    options: {
      retryStrategy: (times: number) => {
        if (times > 3) {
          return new Error('Redis connection failed after 3 retries');
        }
        return Math.min(times * 50, 2000); // Exponential backoff
      },
    },
  };
};
