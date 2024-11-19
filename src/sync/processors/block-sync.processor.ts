/**
 * 🛠️ **BlockSyncProcessor**
 *
 * This processor is responsible for synchronizing blockchain data for multiple Ethereum-based liquidity pools.
 *
 * **Architecture Highlights:**
 * - **Configurable Pool Management:** Utilizes a `PoolInfo` interface and a centralized `pools` array, allowing easy addition or removal of pools.
 * - **Scalability:** To accommodate new Ethereum pools, simply define their configurations adhering to the `PoolInfo` interface and add them to the `pools` array.
 * - **Modular Design:** Separates concerns by delegating blockchain interactions to `EtherscanService` and pool data management to `PoolsService`.
 * - **Type Safety:** Employs TypeScript interfaces to ensure consistent and reliable pool configurations.
 *
 * **Adding a New Ethereum Pool:**
 * 1. **Define the Pool Configuration:** Create a new pool object that implements the `PoolInfo` interface in /pools.constants.ts.
 * 2. **Add to Pools Array:** Include the new pool in the `pools` array within the processor.
 * 3. **No Further Code Changes Needed:** The processor automatically handles the new pool based on its configuration.
 *
 * This design ensures that the system remains maintainable and easily extendable as the number of supported pools grows.
 */
import { Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import {
  BLOCK_SYNC_QUEUE,
  TRANSACTION_PROCESSING_QUEUE,
} from '../sync.constants';
import { EtherscanService } from '../../integrations/etherscan/etherscan.service';
import { PoolsService } from '../../pools/pools.service';
import { USDC_WETH_POOL_INFO } from '../../pools/constants/pools.constants';
import { ChainType } from '../../pools/constants/pools.enums';
import { CHAIN_MAP } from '../../common/constants';
import { PoolInfo } from '../../pools/interfaces/pool-info.interface';

@Processor(BLOCK_SYNC_QUEUE, {
  limiter: { max: 1, duration: 1000 }, // max 1 request per 1000 ms
})
export class BlockSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(BlockSyncProcessor.name);
  private readonly pools = [USDC_WETH_POOL_INFO];

  constructor(
    @InjectQueue(TRANSACTION_PROCESSING_QUEUE)
    private readonly transactionQueue: Queue,
    private readonly etherscanService: EtherscanService,
    private readonly poolsService: PoolsService,
  ) {
    super();
  }

  async process() {
    this.logger.log(`Polling for new blocks...`);
    for (const pool of this.pools) {
      await this.processPool(pool);
    }
  }

  private async processPool(pool: PoolInfo) {
    try {
      const latestBlock = await this.fetchLatestBlock();
      const currentBlock = await this.getCurrentBlock(pool);

      if (this.hasNewBlocks(latestBlock, currentBlock)) {
        this.logger.log(
          `Processing blocks for pool ${pool.address}: ${Number(currentBlock) + 1} to ${latestBlock}`,
        );
        await this.enqueueTransactionJob(pool, currentBlock, latestBlock);
      } else {
        this.logger.debug(`No new blocks to process for pool ${pool.address}`);
      }
    } catch (error) {
      this.handleError(pool, error);
    }
  }

  private async fetchLatestBlock(): Promise<number> {
    const latestBlock = await this.etherscanService.getBlockNumber();
    this.logger.log(
      `Latest block for chain ${CHAIN_MAP.ETHEREUM_MAINNET}: ${latestBlock}`,
    );
    return latestBlock;
  }

  private async getCurrentBlock(
    pool: typeof USDC_WETH_POOL_INFO,
  ): Promise<number> {
    const currentBlock = await this.poolsService.getCurrentBlock(
      pool.chainType,
      pool.address,
      pool.chainId,
    );
    this.logger.log(
      `Current block for pool ${pool.address} on chain ${CHAIN_MAP.ETHEREUM_MAINNET}: ${currentBlock}`,
    );
    return currentBlock;
  }

  private hasNewBlocks(latestBlock: number, currentBlock: number): boolean {
    return Number(latestBlock) > Number(currentBlock);
  }

  private async enqueueTransactionJob(
    pool: PoolInfo,
    currentBlock: number,
    latestBlock: number,
  ) {
    await this.transactionQueue.add(
      'process_transactions',
      {
        contractAddress: pool.token0,
        poolAddress: pool.address,
        chainId: pool.chainId,
        startBlock: Number(currentBlock) + 1, // Start from the next block
        endBlock: latestBlock,
        chainType: ChainType.ETHEREUM,
      },
      { removeOnComplete: true, removeOnFail: true },
    );
    this.logger.log(
      `Transaction processing job added for pool ${pool.address}`,
    );
  }

  private handleError(pool: PoolInfo, error: Error) {
    this.logger.error(
      `Error while processing pool ${pool.address}: ${error.message}`,
      error.stack,
    );
  }
}
