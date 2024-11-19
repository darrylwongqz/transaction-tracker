import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env
dotenv.config({
  path: '.env',
});

const isTest = process.env.NODE_ENV === 'test';

const databaseName = isTest
  ? process.env.DATABASE_NAME_TEST
  : process.env.DATABASE_NAME;

const host = isTest
  ? process.env.DATABASE_HOST_TEST
  : process.env.NODE_ENV === 'development'
    ? process.env.DATABASE_HOST_DEV
    : process.env.DATABASE_HOST;

// Define DataSourceOptions
const databaseConfig = {
  type: 'mysql',
  host: host,
  port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: databaseName,
  entities: [join(__dirname, '../**/*.entity.{js,ts}')],
  migrations: [join(__dirname, '../', '**/migrations/*.{js,ts}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

// Create the AppDataSource for TypeORM CLI
export const AppDataSource = new DataSource(
  databaseConfig as DataSourceOptions,
);
