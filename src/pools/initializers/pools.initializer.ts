import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PoolsService } from '../pools.service';
import {
  USDC_WETH_POOL_INFO,
  SOLANA_USDC_POOL_INFO,
} from '../constants/pools.constants';

@Injectable()
export class PoolsInitializer implements OnModuleInit {
  private readonly logger = new Logger(PoolsInitializer.name);

  constructor(
    private readonly poolsService: PoolsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const appStartBlock = this.configService.get<number>('APP_START_BLOCK');

    const poolsToInitialize = [
      {
        ...USDC_WETH_POOL_INFO,
        currentBlock: appStartBlock ?? USDC_WETH_POOL_INFO.createdBlock,
      },
      {
        // NOTE: this is only an example to illustrate how the application can be extended
        // SOLANA HANDLERS SHOULD NOT BE USED UNTIL PROPERLY CONFIGURED
        ...SOLANA_USDC_POOL_INFO,
        currentBlock: SOLANA_USDC_POOL_INFO.createdBlock,
      },
    ];

    for (const pool of poolsToInitialize) {
      try {
        await this.poolsService.upsertPool(
          pool.address,
          pool.chainId,
          pool.currentBlock,
        );
        this.logger.log(
          `Successfully initialized pool with address ${pool.address} on chainId ${pool.chainId}.`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to initialize pool with address ${pool.address} on chainId ${pool.chainId}: ${error.message}`,
        );
      }
    }
  }
}
