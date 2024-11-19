// sync.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PoolsService } from '../pools/pools.service';
import { SyncStatusResponseDto } from './dtos/response/sync-status-response.dto';
import { SyncStatusQueryDto } from './dtos/request/sync-status-query.dto';
import { ChainType } from '../pools/constants/pools.enums';
import { Logger } from '@nestjs/common';
import { PoolInfo } from '../pools/interfaces/pool-info.interface';

/**
 * MockSyncService
 *
 * A mock implementation of SyncService for testing purposes.
 */
const MockSyncService: Partial<jest.Mocked<SyncService>> = {
  getSyncStatus: jest.fn(),
};

/**
 * MockPoolsService
 *
 * A mock implementation of PoolsService for testing purposes.
 */
const MockPoolsService: Partial<jest.Mocked<PoolsService>> = {
  getPoolByAddress: jest.fn(),
};

/**
 * MockLogger
 *
 * A mock implementation of Logger to suppress actual logging during tests.
 */
const MockLogger: Partial<jest.Mocked<Logger>> = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

/**
 * Mock PoolInfo Object
 *
 * Provides all necessary properties to satisfy the PoolInfo interface.
 */
const mockPool: PoolInfo = {
  chainType: ChainType.ETHEREUM,
  address: '0xPoolAddress1234567890abcdef1234567890abcdef1234',
  chainId: 1,
  token0: '0xToken0Address1234567890abcdef1234567890abcdef12',
  token1: '0xToken1Address1234567890abcdef1234567890abcdef34',
  createdBlock: 1000,
  description: 'Test Pool Description',
};

/**
 * Mock SyncStatusResponseDto Object
 *
 * Provides a sample response from SyncService.
 */
const mockSyncStatus: SyncStatusResponseDto = {
  status: 'DB is 100 blocks behind',
  latestBlock: 4000,
  currentSyncBlock: 3900,
  chainId: 1,
  poolAddress: mockPool.address,
};

describe('SyncController', () => {
  let controller: SyncController;
  let syncService: jest.Mocked<SyncService>;
  let poolsService: jest.Mocked<PoolsService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: MockSyncService,
        },
        {
          provide: PoolsService,
          useValue: MockPoolsService,
        },
        {
          provide: Logger,
          useValue: MockLogger,
        },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
    syncService = module.get<SyncService>(
      SyncService,
    ) as jest.Mocked<SyncService>;
    poolsService = module.get<PoolsService>(
      PoolsService,
    ) as jest.Mocked<PoolsService>;
    logger = module.get<Logger>(Logger) as jest.Mocked<Logger>;

    // Clear all mocks before each test to ensure test isolation
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSyncStatus', () => {
    const validQuery: SyncStatusQueryDto = {
      address: '0xPoolAddress1234567890abcdef1234567890abcdef1234',
    };

    /**
     * Test: Successful Sync Status Retrieval
     *
     * Verifies that the controller correctly retrieves and returns the sync status when provided with a valid pool address.
     */
    it('should return correct sync status when services return expected values', async () => {
      // Arrange
      poolsService.getPoolByAddress.mockReturnValueOnce(mockPool);
      syncService.getSyncStatus.mockResolvedValueOnce(mockSyncStatus);

      // Act
      const result = await controller.getSyncStatus(validQuery);

      // Assert
      expect(poolsService.getPoolByAddress).toHaveBeenCalledWith(
        validQuery.address,
      );
      expect(syncService.getSyncStatus).toHaveBeenCalledWith(
        mockPool.chainType,
        mockPool.address,
        mockPool.chainId,
      );
      expect(result).toEqual<SyncStatusResponseDto>(mockSyncStatus);
    });

    /**
     * Test: Pool Not Found Error
     *
     * Ensures that the controller correctly propagates an error when the specified pool is not found.
     */
    it('should throw an error if PoolsService.getPoolByAddress throws', async () => {
      // Arrange
      const error = new Error('Pool not found');
      poolsService.getPoolByAddress.mockImplementationOnce(() => {
        throw error;
      });

      // Act & Assert
      await expect(controller.getSyncStatus(validQuery)).rejects.toThrow(error);
      expect(poolsService.getPoolByAddress).toHaveBeenCalledWith(
        validQuery.address,
      );
      expect(syncService.getSyncStatus).not.toHaveBeenCalled();
    });

    /**
     * Test: SyncService Failure
     *
     * Verifies that the controller correctly propagates an error when SyncService.getSyncStatus fails.
     */
    it('should throw an error if SyncService.getSyncStatus throws', async () => {
      // Arrange
      const error = new Error('SyncService failure');
      poolsService.getPoolByAddress.mockReturnValueOnce(mockPool);
      syncService.getSyncStatus.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(controller.getSyncStatus(validQuery)).rejects.toThrow(error);
      expect(poolsService.getPoolByAddress).toHaveBeenCalledWith(
        validQuery.address,
      );
      expect(syncService.getSyncStatus).toHaveBeenCalledWith(
        mockPool.chainType,
        mockPool.address,
        mockPool.chainId,
      );
    });

    /**
     * Test: Zero Blocks Behind
     *
     * Verifies that the controller returns the correct status message when the latest block equals the current sync block.
     */
    it('should return status as "DB is 0 blocks behind" when latestBlock equals currentBlock', async () => {
      // Arrange
      const latestBlock = 3000;
      const currentBlock = 3000;
      const updatedSyncStatus: SyncStatusResponseDto = {
        status: 'DB is 0 blocks behind',
        latestBlock,
        currentSyncBlock: currentBlock,
        chainId: 1,
        poolAddress: mockPool.address,
      };

      poolsService.getPoolByAddress.mockReturnValueOnce(mockPool);
      syncService.getSyncStatus.mockResolvedValueOnce(updatedSyncStatus);

      // Act
      const result = await controller.getSyncStatus(validQuery);

      // Assert
      expect(result.status).toBe('DB is 0 blocks behind');
    });

    /**
     * Test: Positive Blocks Behind
     *
     * Ensures that the controller returns the correct status message when there are positive blocks behind.
     */
    it('should return status as "DB is 100 blocks behind" where x is positive', async () => {
      // Arrange
      const latestBlock = 4000;
      const currentBlock = 3900;
      const updatedSyncStatus: SyncStatusResponseDto = {
        status: `DB is ${latestBlock - currentBlock} blocks behind`,
        latestBlock,
        currentSyncBlock: currentBlock,
        chainId: 1,
        poolAddress: mockPool.address,
      };

      poolsService.getPoolByAddress.mockReturnValueOnce(mockPool);
      syncService.getSyncStatus.mockResolvedValueOnce(updatedSyncStatus);

      // Act
      const result = await controller.getSyncStatus(validQuery);

      // Assert
      expect(result.status).toBe('DB is 100 blocks behind');
    });
  });
});
