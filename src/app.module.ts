import { Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database-config';
import { PoolsModule } from './pools/pools.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SyncModule } from './sync/sync.module';
import * as Joi from 'joi';
import { EtherscanModule } from './integrations/etherscan/etherscan.module';
import { BinanceModule } from './integrations/binance/binance.module';
import { PricingModule } from './pricing/pricing.module';
import type { RedisClientOptions } from 'redis';
import { CacheModule } from '@nestjs/cache-manager';
import { getCacheConfig } from './config/cache-config';
import { BullModule } from '@nestjs/bullmq';
import { getBullConfig } from './config/bull-config';
import { ScheduleModule } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule available throughout the app
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.string().default('localhost'),
        DATABASE_PORT: Joi.number().default(3306),
        DATABASE_USERNAME: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig, // Use the getDatabaseConfig function
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getCacheConfig,
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getBullConfig,
    }),
    PoolsModule,
    TransactionsModule,
    SyncModule,
    EtherscanModule,
    BinanceModule,
    PricingModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    this.logger.log('Running database migrations...');
    try {
      await this.dataSource.runMigrations();
      await this.logger.log('Database migrations executed successfully.');
    } catch (error) {
      this.logger.error('Failed to run database migrations:', error.message);
    }
  }
}
