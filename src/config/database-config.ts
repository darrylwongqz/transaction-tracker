import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { join } from 'path';

const entities = [TransactionEntity];

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isDevelopment = configService.get<string>('NODE_ENV') === 'development';
  return {
    type: 'mysql',
    host: isDevelopment
      ? configService.get<string>('DATABASE_HOST_DEV')
      : configService.get<string>('DATABASE_HOST'),
    port: configService.get<number>('DATABASE_PORT'),
    username: configService.get<string>('DATABASE_USERNAME'),
    password: configService.get<string>('DATABASE_PASSWORD'),
    database: configService.get<string>('DATABASE_NAME'),
    entities: [join(__dirname, '../', '**/*.entity.{js,ts}'), ...entities],
    migrations: [join(__dirname, '../', '**/migrations/*.{js,ts}')],
    synchronize: false,
    logging: isDevelopment,
  };
};
