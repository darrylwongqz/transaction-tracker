import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PoolsService } from './pools.service';
import { PoolEntity } from './entities/pools.entity';
import { PoolsInitializer } from './initializers/pools.initializer';
import { PoolHandlerFactory } from './pool-handler.factory';
import { SolanaPoolHandler } from './handlers/solana-pool.handler';
import { EthereumPoolHandler } from './handlers/ethereum-pool.handler';
import { BasePoolHandlerService } from './handlers/base-pool-handler.service';
import { MigrationService } from './initializers/migrations.service';

@Module({
  imports: [TypeOrmModule.forFeature([PoolEntity]), ConfigModule],
  providers: [
    BasePoolHandlerService,
    EthereumPoolHandler,
    SolanaPoolHandler,
    PoolHandlerFactory,
    PoolsService,
    PoolsInitializer,
    MigrationService,
  ],
  exports: [PoolsService, MigrationService],
})
export class PoolsModule {}
