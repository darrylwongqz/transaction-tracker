import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { join } from 'path';

const entities = [TransactionEntity];

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isDevelopment = configService.get<string>('NODE_ENV') === 'development';
  const isTest = configService.get<string>('NODE_ENV') === 'test';
  const databaseName = isTest
    ? configService.get<string>('DATABASE_NAME_TEST')
    : configService.get<string>('DATABASE_NAME');

  const host = isTest
    ? configService.get<string>('DATABASE_HOST_TEST')
    : isDevelopment
      ? configService.get<string>('DATABASE_HOST_DEV')
      : configService.get<string>('DATABASE_HOST');

  return {
    type: 'mysql',
    host: host,
    port: configService.get<number>('DATABASE_PORT'),
    username: configService.get<string>('DATABASE_USERNAME'),
    password: configService.get<string>('DATABASE_PASSWORD'),
    database: databaseName,
    entities: [join(__dirname, '../', '**/*.entity.{js,ts}'), ...entities],
    migrations: [join(__dirname, '../', '**/migrations/*.{js,ts}')],
    synchronize: isTest,
    logging: isDevelopment,
  };
};
