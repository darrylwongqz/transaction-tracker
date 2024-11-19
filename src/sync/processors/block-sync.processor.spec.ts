// block-sync.processor.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { BlockSyncProcessor } from './block-sync.processor';
import { Queue } from 'bullmq';
import { EtherscanService } from '../../integrations/etherscan/etherscan.service';
import { PoolsService } from '../../pools/pools.service';
import { Logger } from '@nestjs/common';
import { PoolInfo } from '../../pools/interfaces/pool-info.interface';
import { USDC_WETH_POOL_INFO } from '../../pools/constants/pools.constants';
import { ChainType } from '../../pools/constants/pools.enums';
import { CHAIN_MAP } from '../../common/constants';
import { TRANSACTION_PROCESSING_QUEUE } from '../sync.constants';
import { getQueueToken } from '@nestjs/bullmq';

describe('BlockSyncProcessor', () => {
  let processor: BlockSyncProcessor;
  let transactionQueue: jest.Mocked<Queue>;
  let etherscanService: jest.Mocked<EtherscanService>;
  let poolsService: jest.Mocked<PoolsService>;

  // Spies for Logger methods
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Spy on Logger methods before instantiating the processor
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    debugSpy = jest
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => {});

    // Create mocks for dependencies

    // Mock the TRANSACTION_PROCESSING_QUEUE using getQueueToken
    transactionQueue = {
      add: jest.fn(),
      // Add other Queue methods if needed
    } as unknown as jest.Mocked<Queue>;

    // Mock EtherscanService
    etherscanService = {
      getBlockNumber: jest.fn(),
    } as unknown as jest.Mocked<EtherscanService>;

    // Mock PoolsService
    poolsService = {
      getCurrentBlock: jest.fn(),
    } as unknown as jest.Mocked<PoolsService>;

    // Initialize the testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockSyncProcessor,
        {
          provide: getQueueToken(TRANSACTION_PROCESSING_QUEUE),
          useValue: transactionQueue,
        },
        {
          provide: EtherscanService,
          useValue: etherscanService,
        },
        {
          provide: PoolsService,
          useValue: poolsService,
        },
        // Do not provide Logger, since it's instantiated internally
      ],
    }).compile();

    // Retrieve the processor instance
    processor = module.get<BlockSyncProcessor>(BlockSyncProcessor);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  /**
   * Test: Processor Definition
   *
   * Ensures that the BlockSyncProcessor is defined and properly instantiated.
   */
  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  /**
   * Describe: process
   *
   * Contains all tests related to the process method of BlockSyncProcessor.
   */
  describe('process', () => {
    /**
     * Test: Successful Block Synchronization
     *
     * Verifies that when there are new blocks, the processor correctly enqueues a transaction processing job.
     */
    it('should process all pools and enqueue transaction job when there are new blocks', async () => {
      // Arrange
      const latestBlock = 2000;
      const currentBlock = 1980;

      etherscanService.getBlockNumber.mockResolvedValueOnce(latestBlock);
      poolsService.getCurrentBlock.mockResolvedValueOnce(currentBlock);

      // Act
      await processor.process();

      // Assert
      expect(logSpy).toHaveBeenCalledWith('Polling for new blocks...');
      expect(etherscanService.getBlockNumber).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        `Latest block for chain ${CHAIN_MAP.ETHEREUM_MAINNET}: ${latestBlock}`,
      );
      expect(poolsService.getCurrentBlock).toHaveBeenCalledWith(
        USDC_WETH_POOL_INFO.chainType,
        USDC_WETH_POOL_INFO.address,
        USDC_WETH_POOL_INFO.chainId,
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Current block for pool ${USDC_WETH_POOL_INFO.address} on chain ${CHAIN_MAP.ETHEREUM_MAINNET}: ${currentBlock}`,
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Processing blocks for pool ${USDC_WETH_POOL_INFO.address}: ${currentBlock + 1} to ${latestBlock}`,
      );
      expect(transactionQueue.add).toHaveBeenCalledWith(
        'process_transactions',
        {
          contractAddress: USDC_WETH_POOL_INFO.token0, // Corrected to actual token0 address
          poolAddress: USDC_WETH_POOL_INFO.address,
          chainId: USDC_WETH_POOL_INFO.chainId,
          startBlock: currentBlock + 1, // Start from the next block
          endBlock: latestBlock,
          chainType: ChainType.ETHEREUM,
        },
        { removeOnComplete: true, removeOnFail: true },
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Transaction processing job added for pool ${USDC_WETH_POOL_INFO.address}`,
      );
    });

    /**
     * Test: No New Blocks to Synchronize
     *
     * Ensures that when there are no new blocks, the processor does not enqueue a transaction processing job.
     */
    it('should not enqueue transaction job when there are no new blocks', async () => {
      // Arrange
      const latestBlock = 2000;
      const currentBlock = 2000;

      etherscanService.getBlockNumber.mockResolvedValueOnce(latestBlock);
      poolsService.getCurrentBlock.mockResolvedValueOnce(currentBlock);

      // Act
      await processor.process();

      // Assert
      expect(logSpy).toHaveBeenCalledWith('Polling for new blocks...');
      expect(etherscanService.getBlockNumber).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        `Latest block for chain ${CHAIN_MAP.ETHEREUM_MAINNET}: ${latestBlock}`,
      );
      expect(poolsService.getCurrentBlock).toHaveBeenCalledWith(
        USDC_WETH_POOL_INFO.chainType,
        USDC_WETH_POOL_INFO.address,
        USDC_WETH_POOL_INFO.chainId,
      );
      expect(logSpy).toHaveBeenCalledWith(
        `Current block for pool ${USDC_WETH_POOL_INFO.address} on chain ${CHAIN_MAP.ETHEREUM_MAINNET}: ${currentBlock}`,
      );
      expect(debugSpy).toHaveBeenCalledWith(
        `No new blocks to process for pool ${USDC_WETH_POOL_INFO.address}`,
      );
      expect(transactionQueue.add).not.toHaveBeenCalled();
    });

    /**
     * Test: Handle Errors During Block Fetching
     *
     * Verifies that the processor correctly handles errors when fetching the latest block.
     */
    it('should handle errors during fetching latest block', async () => {
      // Arrange
      const error = new Error('Etherscan API failure');
      etherscanService.getBlockNumber.mockRejectedValueOnce(error);

      // Act
      await processor.process();

      // Assert
      expect(logSpy).toHaveBeenCalledWith('Polling for new blocks...');
      expect(etherscanService.getBlockNumber).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        `Error while processing pool ${USDC_WETH_POOL_INFO.address}: ${error.message}`,
        error.stack,
      );
      expect(transactionQueue.add).not.toHaveBeenCalled();
    });

    /**
     * Test: Handle Errors During Current Block Retrieval
     *
     * Ensures that the processor handles errors when retrieving the current block from PoolsService.
     */
    it('should handle errors during getting current block', async () => {
      // Arrange
      const latestBlock = 2000;
      const error = new Error('PoolsService failure');

      etherscanService.getBlockNumber.mockResolvedValueOnce(latestBlock);
      poolsService.getCurrentBlock.mockRejectedValueOnce(error);

      // Act
      await processor.process();

      // Assert
      expect(logSpy).toHaveBeenCalledWith('Polling for new blocks...');
      expect(etherscanService.getBlockNumber).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        `Latest block for chain ${CHAIN_MAP.ETHEREUM_MAINNET}: ${latestBlock}`,
      );
      expect(poolsService.getCurrentBlock).toHaveBeenCalledWith(
        USDC_WETH_POOL_INFO.chainType,
        USDC_WETH_POOL_INFO.address,
        USDC_WETH_POOL_INFO.chainId,
      );
      expect(errorSpy).toHaveBeenCalledWith(
        `Error while processing pool ${USDC_WETH_POOL_INFO.address}: ${error.message}`,
        error.stack,
      );
      expect(transactionQueue.add).not.toHaveBeenCalled();
    });
  });
});
