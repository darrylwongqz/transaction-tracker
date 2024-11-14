import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

const entities = [];

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
    entities: [...entities],
    migrations: ['dist/migrations/*.js'],
    synchronize: false,
    logging: isDevelopment,
  };
};

/**
 * DataSource for TypeORM CLI to generate and run migrations, used outside of the NestJS app context.
 */
export const AppDataSource = new DataSource({
  type: 'mysql',
  host:
    process.env.NODE_ENV === 'development'
      ? process.env.DATABASE_HOST_DEV
      : process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [...entities],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: true,
});
