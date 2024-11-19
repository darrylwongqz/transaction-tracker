import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { Logger } from '@nestjs/common';

/**
 * Returns the configuration for BullMQ queues.
 * The configuration ensures queues are connected to Redis using consistent settings.
 *
 * @param configService - The NestJS ConfigService to fetch environment variables.
 * @returns BullMQ configuration object with a shared Redis connection.
 */
export const getBullConfig = (
  configService: ConfigService,
): {
  connection: RedisOptions;
  options?: Record<string, any>;
} => {
  const nodeEnv = configService.get<string>('NODE_ENV');
  const isTest = nodeEnv === 'test';

  const redisOptions: RedisOptions = isTest
    ? {
        host: configService.get<string>('REDIS_HOST_TEST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
      }
    : {
        host:
          process.env.NODE_ENV === 'development'
            ? configService.get<string>('REDIS_HOST_DEV', 'localhost')
            : configService.get<string>('REDIS_HOST', 'redis'),
        port: configService.get<number>('REDIS_PORT', 6379),
      };

  const logger = new Logger('BullMQConfig');

  // Redis connection configuration

  const redisClient = new Redis(redisOptions);

  // Log Redis events
  redisClient.on('connect', () => {
    logger.log('Connected to Redis for BullMQ');
  });

  redisClient.on('ready', () => {
    logger.log('Redis is ready for BullMQ');
  });

  redisClient.on('error', (err) => {
    logger.error(`Redis Error: ${err.message}`, err.stack);
  });

  return {
    connection: redisOptions, // Use RedisOptions for BullMQ connection
    options: {
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.error('BullMQ: Redis connection failed after 3 retries');
          return new Error('Redis connection failed after 3 retries');
        }
        return Math.min(times * 50, 2000); // Exponential backoff
      },
    },
  };
};
