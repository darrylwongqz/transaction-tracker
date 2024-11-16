import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PoolsService } from '../pools.service';
import {
  USDC_WETH_POOL_INFO,
  SOLANA_USDC_POOL_INFO,
} from '../constants/pools.constants';
import { PoolsInitializer } from './pools.initializer';
import { Logger } from '@nestjs/common';

describe('PoolsInitializer', () => {
  let poolsInitializer: PoolsInitializer;
  let poolsService: PoolsService;
  let configService: ConfigService;

  const mockPoolsService = {
    upsertPool: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolsInitializer,
        {
          provide: PoolsService,
          useValue: mockPoolsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    poolsInitializer = module.get<PoolsInitializer>(PoolsInitializer);
    poolsService = module.get<PoolsService>(PoolsService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();

    // Mock the Logger used in PoolsInitializer
    jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());
    jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
  });

  it('should be defined', () => {
    expect(poolsInitializer).toBeDefined();
    expect(poolsService).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should upsert pools with appStartBlock if defined', async () => {
      const mockAppStartBlock = 15000000;
      mockConfigService.get.mockReturnValue(mockAppStartBlock);

      await poolsInitializer.onModuleInit();

      expect(configService.get).toHaveBeenCalledWith('APP_START_BLOCK');
      expect(poolsService.upsertPool).toHaveBeenCalledTimes(2);
      expect(poolsService.upsertPool).toHaveBeenCalledWith(
        USDC_WETH_POOL_INFO.address,
        USDC_WETH_POOL_INFO.chainId,
        mockAppStartBlock,
      );
      expect(poolsService.upsertPool).toHaveBeenCalledWith(
        SOLANA_USDC_POOL_INFO.address,
        SOLANA_USDC_POOL_INFO.chainId,
        SOLANA_USDC_POOL_INFO.createdBlock,
      );
    });

    it('should handle errors gracefully for individual pools', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      mockPoolsService.upsertPool
        .mockResolvedValueOnce(undefined) // Simulate success for the first pool
        .mockRejectedValueOnce(new Error('Database error')); // Simulate failure for the second pool

      await expect(poolsInitializer.onModuleInit()).resolves.not.toThrow();

      expect(poolsService.upsertPool).toHaveBeenCalledTimes(2);
      expect(Logger.prototype.error).toHaveBeenCalledTimes(1);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to initialize pool with address ${SOLANA_USDC_POOL_INFO.address} on chainId ${SOLANA_USDC_POOL_INFO.chainId}: Database error`,
      );
    });

    it('should log errors if all pool upserts fail', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      // Simulate failure for all pools
      mockPoolsService.upsertPool.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(poolsInitializer.onModuleInit()).resolves.not.toThrow();

      expect(poolsService.upsertPool).toHaveBeenCalledTimes(2);
      expect(Logger.prototype.error).toHaveBeenCalledTimes(2);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to initialize pool with address ${USDC_WETH_POOL_INFO.address} on chainId ${USDC_WETH_POOL_INFO.chainId}: Database error`,
      );
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `Failed to initialize pool with address ${SOLANA_USDC_POOL_INFO.address} on chainId ${SOLANA_USDC_POOL_INFO.chainId}: Database error`,
      );
    });
  });
});
