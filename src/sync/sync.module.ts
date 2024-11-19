import { MiddlewareConsumer, Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import {
  BLOCK_SYNC_QUEUE,
  TRANSACTION_PROCESSING_QUEUE,
} from './sync.constants';
import { EtherscanModule } from '../integrations/etherscan/etherscan.module';
import { PricingModule } from '../pricing/pricing.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { PoolsModule } from '../pools/pools.module';
import { Queue } from 'bullmq';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BlockSyncProcessor } from './processors/block-sync.processor';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { TransactionProcessingProcessor } from './processors/transaction-processing.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: BLOCK_SYNC_QUEUE },
      { name: TRANSACTION_PROCESSING_QUEUE },
    ),
    EtherscanModule,
    PricingModule,
    TransactionsModule,
    PoolsModule,
  ],
  controllers: [SyncController],
  providers: [SyncService, BlockSyncProcessor, TransactionProcessingProcessor],
})
export class SyncModule {
  constructor(
    @InjectQueue(BLOCK_SYNC_QUEUE) private blockSyncQueue: Queue,
    @InjectQueue(TRANSACTION_PROCESSING_QUEUE)
    private transactionProcessingQueue: Queue,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/sync/queues');

    createBullBoard({
      queues: [
        new BullMQAdapter(this.blockSyncQueue),
        new BullMQAdapter(this.transactionProcessingQueue),
      ],
      serverAdapter,
    });

    consumer.apply(serverAdapter.getRouter()).forRoutes('sync/queues');
  }
}
