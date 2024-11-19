import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { SyncStatusResponseDto } from './dtos/response/sync-status-response.dto';
import { PoolsService } from '../pools/pools.service';
import { EtherscanService } from '../integrations/etherscan/etherscan.service';
import { BLOCK_SYNC_QUEUE } from './sync.constants';
import { ChainType } from '../pools/constants/pools.enums';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectQueue(BLOCK_SYNC_QUEUE) private blockSyncQueue: Queue,
    private poolsService: PoolsService,
    private etherscanService: EtherscanService,
  ) {}

  /**
   * Cron job to poll for new blocks across all pools every 10 seconds.
   * Adds a job to the block synchronization queue.
   */
  @Cron('*/10 * * * * *', {
    name: 'pollBlocksCron',
    disabled: process.env.NODE_ENV === 'test',
  })
  async pollNewBlocks() {
    this.logger.log('Starting block polling...');
    try {
      await this.blockSyncQueue.add(
        'poll_blocks',
        {}, // No specific payload needed
        { removeOnComplete: 10, removeOnFail: 10 },
      );
      this.logger.log('Job successfully added to BLOCK_SYNC_QUEUE');
    } catch (error) {
      this.logger.error('Error adding job to BLOCK_SYNC_QUEUE', error.stack);
    }
    return true;
  }

  /**
   * Get synchronization status for a specific pool.
   * Calculates how many blocks behind the synchronization is for the pool.
   *
   * @returns SyncStatusEntity containing the status, latest block, and current sync block.
   */
  async getSyncStatus(
    chainType: ChainType,
    poolAddress: string,
    chainId: number,
  ): Promise<SyncStatusResponseDto> {
    this.logger.log(
      `Fetching sync status for poolAddress: ${poolAddress}, chainId: ${chainId}`,
    );

    try {
      const latestBlock = await this.etherscanService.getBlockNumber();
      const currentBlock = await this.poolsService.getCurrentBlock(
        chainType,
        poolAddress,
        chainId,
      );

      const blocksBehind = Math.max(latestBlock - currentBlock, 0);

      this.logger.log(
        `Sync status fetched: latestBlock=${latestBlock}, currentBlock=${currentBlock}, blocksBehind=${blocksBehind}`,
      );

      return {
        status: `DB is ${blocksBehind} blocks behind`,
        latestBlock,
        currentSyncBlock: currentBlock,
        chainId,
        poolAddress,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching sync status for poolAddress: ${poolAddress}, chainId: ${chainId}`,
        error.stack,
      );
      throw error;
    }
  }
}
