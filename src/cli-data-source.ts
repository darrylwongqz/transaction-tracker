import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env
dotenv.config();

// Define DataSourceOptions
const databaseConfig = {
  type: 'mysql',
  host:
    process.env.NODE_ENV === 'development'
      ? process.env.DATABASE_HOST_DEV
      : process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [join(__dirname, '../**/*.entity.{js,ts}')],
  migrations: [join(__dirname, '../', '**/migrations/*.{js,ts}')],
  synchronize: false,
  logging: true,
};

// Create the AppDataSource for TypeORM CLI
export const AppDataSource = new DataSource(
  databaseConfig as DataSourceOptions,
);
