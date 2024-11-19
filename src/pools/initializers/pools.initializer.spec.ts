import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PoolsService } from '../pools.service';
import { PoolsInitializer } from './pools.initializer';
import { MigrationService } from './migrations.service';
import { USDC_WETH_POOL_INFO } from '../constants/pools.constants';

describe('PoolsInitializer', () => {
  let poolsInitializer: PoolsInitializer;
  let poolsService: Partial<PoolsService>;
  let migrationService: Partial<MigrationService>;
  let configService: Partial<ConfigService>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    poolsService = {
      upsertPool: jest.fn(),
    };

    migrationService = {
      ensureMigrationsRun: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'APP_START_BLOCK') {
          return 12345; // Mocked start block
        }
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolsInitializer,
        { provide: PoolsService, useValue: poolsService },
        { provide: MigrationService, useValue: migrationService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    poolsInitializer = module.get<PoolsInitializer>(PoolsInitializer);

    // Mock Logger methods
    loggerSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation(); // Mock console.log if needed
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should ensure migrations are run before initializing pools', async () => {
    await poolsInitializer.onApplicationBootstrap();

    expect(migrationService.ensureMigrationsRun).toHaveBeenCalledTimes(1);
    expect(poolsService.upsertPool).toHaveBeenCalledWith(
      USDC_WETH_POOL_INFO.address,
      USDC_WETH_POOL_INFO.chainId,
      12345, // Mocked start block
    );
  });

  it('should use the default pool creation block if APP_START_BLOCK is not set', async () => {
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'APP_START_BLOCK') {
        return undefined;
      }
      return undefined;
    });

    await poolsInitializer.onApplicationBootstrap();

    expect(poolsService.upsertPool).toHaveBeenCalledWith(
      USDC_WETH_POOL_INFO.address,
      USDC_WETH_POOL_INFO.chainId,
      USDC_WETH_POOL_INFO.createdBlock,
    );
  });
});
