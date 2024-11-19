// sync.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { InjectQueue, getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PoolsService } from '../pools/pools.service';
import { EtherscanService } from '../integrations/etherscan/etherscan.service';
import { Logger } from '@nestjs/common';
import { ChainType } from '../pools/constants/pools.enums';
import { SyncStatusResponseDto } from './dtos/response/sync-status-response.dto';
import { BLOCK_SYNC_QUEUE } from './sync.constants';

// Define a mocked interface for Queue with only the 'add' method
interface MockedQueue extends Partial<jest.Mocked<Queue>> {
  add: jest.Mock;
}

describe('SyncService', () => {
  let service: SyncService;
  let blockSyncQueue: MockedQueue;
  let poolsService: jest.Mocked<PoolsService>;
  let etherscanService: jest.Mocked<EtherscanService>;
  let logger: Logger;

  // Mock implementations
  const mockBlockSyncQueue: MockedQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: getQueueToken(BLOCK_SYNC_QUEUE), // Correct provider token
          useValue: mockBlockSyncQueue,
        },
        {
          provide: PoolsService,
          useValue: {
            getCurrentBlock: jest.fn(),
          },
        },
        {
          provide: EtherscanService,
          useValue: {
            getBlockNumber: jest.fn(),
          },
        },
        {
          provide: Logger,
          useClass: Logger, // Use the actual Logger class
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    blockSyncQueue = module.get<Queue>(
      getQueueToken(BLOCK_SYNC_QUEUE),
    ) as unknown as MockedQueue;
    poolsService = module.get<PoolsService>(
      PoolsService,
    ) as jest.Mocked<PoolsService>;
    etherscanService = module.get<EtherscanService>(
      EtherscanService,
    ) as jest.Mocked<EtherscanService>;
    logger = module.get<Logger>(Logger);

    // Spy on Logger methods
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('pollNewBlocks', () => {
    it('should add a "poll_blocks" job to the queue and log appropriately', async () => {
      // Arrange
      blockSyncQueue.add.mockResolvedValueOnce(undefined); // Mock successful add

      // Act
      const result = await service.pollNewBlocks();

      // Assert
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Starting block polling...',
      );
      expect(blockSyncQueue.add).toHaveBeenCalledWith(
        'poll_blocks',
        {},
        { removeOnComplete: 10, removeOnFail: 10 },
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Job successfully added to BLOCK_SYNC_QUEUE',
      );
      expect(result).toBe(true);
    });

    it('should handle errors when adding a job to the queue', async () => {
      // Arrange
      const error = new Error('Queue add failed');
      blockSyncQueue.add.mockRejectedValueOnce(error); // Mock failure

      // Act
      const result = await service.pollNewBlocks();

      // Assert
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Starting block polling...',
      );
      expect(blockSyncQueue.add).toHaveBeenCalledWith(
        'poll_blocks',
        {},
        { removeOnComplete: 10, removeOnFail: 10 },
      );
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error adding job to BLOCK_SYNC_QUEUE',
        error.stack,
      );
      expect(result).toBe(true); // Even on error, method returns true
    });
  });

  describe('getSyncStatus', () => {
    const chainType: ChainType = ChainType.ETHEREUM; // Assuming ChainType enum has ETHEREUM
    const poolAddress = '0xPoolAddress1234567890abcdef1234567890abcdef1234';
    const chainId = 1;

    it('should return correct sync status when services return expected values', async () => {
      // Arrange
      const latestBlock = 2000;
      const currentBlock = 1980;
      etherscanService.getBlockNumber.mockResolvedValueOnce(latestBlock);
      poolsService.getCurrentBlock.mockResolvedValueOnce(currentBlock);

      // Act
      const result = await service.getSyncStatus(
        chainType,
        poolAddress,
        chainId,
      );

      // Assert
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Fetching sync status for poolAddress: ${poolAddress}, chainId: ${chainId}`,
      );
      expect(etherscanService.getBlockNumber).toHaveBeenCalled();
      expect(poolsService.getCurrentBlock).toHaveBeenCalledWith(
        chainType,
        poolAddress,
        chainId,
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Sync status fetched: latestBlock=${latestBlock}, currentBlock=${currentBlock}, blocksBehind=${latestBlock - currentBlock}`,
      );
      expect(result).toEqual<SyncStatusResponseDto>({
        status: `DB is ${latestBlock - currentBlock} blocks behind`,
        latestBlock,
        currentSyncBlock: currentBlock,
        chainId,
        poolAddress,
      });
    });

    it('should set status to "DB is 0 blocks behind" if latestBlock is less than currentBlock', async () => {
      // Arrange
      const latestBlock = 1950;
      const currentBlock = 1980;
      etherscanService.getBlockNumber.mockResolvedValueOnce(latestBlock);
      poolsService.getCurrentBlock.mockResolvedValueOnce(currentBlock);

      // Act
      const result = await service.getSyncStatus(
        chainType,
        poolAddress,
        chainId,
      );

      // Assert
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Sync status fetched: latestBlock=${latestBlock}, currentBlock=${currentBlock}, blocksBehind=${Math.max(
          latestBlock - currentBlock,
          0,
        )}`,
      );
      expect(result.status).toBe('DB is 0 blocks behind');
    });

    it('should throw an error if EtherscanService.getBlockNumber fails', async () => {
      // Arrange
      const error = new Error('Etherscan API failure');
      etherscanService.getBlockNumber.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        service.getSyncStatus(chainType, poolAddress, chainId),
      ).rejects.toThrow(error);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Error fetching sync status for poolAddress: ${poolAddress}, chainId: ${chainId}`,
        error.stack,
      );
    });

    it('should throw an error if PoolsService.getCurrentBlock fails', async () => {
      // Arrange
      const latestBlock = 2000;
      const error = new Error('PoolsService failure');
      etherscanService.getBlockNumber.mockResolvedValueOnce(latestBlock);
      poolsService.getCurrentBlock.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(
        service.getSyncStatus(chainType, poolAddress, chainId),
      ).rejects.toThrow(error);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Error fetching sync status for poolAddress: ${poolAddress}, chainId: ${chainId}`,
        error.stack,
      );
    });

    it('should log appropriately during the process', async () => {
      // Arrange
      const latestBlock = 2500;
      const currentBlock = 2450;
      etherscanService.getBlockNumber.mockResolvedValueOnce(latestBlock);
      poolsService.getCurrentBlock.mockResolvedValueOnce(currentBlock);

      // Act
      const result = await service.getSyncStatus(
        chainType,
        poolAddress,
        chainId,
      );

      // Assert
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Fetching sync status for poolAddress: ${poolAddress}, chainId: ${chainId}`,
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        `Sync status fetched: latestBlock=${latestBlock}, currentBlock=${currentBlock}, blocksBehind=${latestBlock - currentBlock}`,
      );
      expect(result.status).toBe(
        `DB is ${latestBlock - currentBlock} blocks behind`,
      );
    });

    it('should return status as "DB is 0 blocks behind" when latestBlock equals currentBlock', async () => {
      // Arrange
      const latestBlock = 3000;
      const currentBlock = 3000;
      etherscanService.getBlockNumber.mockResolvedValueOnce(latestBlock);
      poolsService.getCurrentBlock.mockResolvedValueOnce(currentBlock);

      // Act
      const result = await service.getSyncStatus(
        chainType,
        poolAddress,
        chainId,
      );

      // Assert
      expect(result.status).toBe('DB is 0 blocks behind');
    });

    it('should return status as "DB is 100 blocks behind" where x is positive', async () => {
      // Arrange
      const latestBlock = 4000;
      const currentBlock = 3900;
      etherscanService.getBlockNumber.mockResolvedValueOnce(latestBlock);
      poolsService.getCurrentBlock.mockResolvedValueOnce(currentBlock);

      // Act
      const result = await service.getSyncStatus(
        chainType,
        poolAddress,
        chainId,
      );

      // Assert
      expect(result.status).toBe('DB is 100 blocks behind');
    });
  });
});
