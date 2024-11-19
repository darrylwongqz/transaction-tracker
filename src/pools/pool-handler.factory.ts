import { Injectable, NotFoundException } from '@nestjs/common';
import { ChainType } from './constants/pools.enums';
import { PoolHandlerInterface } from './interfaces/pool-handler.interface';
import { EthereumPoolHandler } from './handlers/ethereum-pool.handler';
// import { SolanaPoolHandler } from './handlers/solana-pool.handler';

@Injectable()
export class PoolHandlerFactory {
  private readonly handlers: Record<ChainType, PoolHandlerInterface<any, any>>;

  constructor(
    private readonly ethereumPoolHandler: EthereumPoolHandler,
    // private readonly solanaPoolHandler: SolanaPoolHandler,
  ) {
    // Map handlers to their respective chain types
    this.handlers = {
      [ChainType.ETHEREUM]: this.ethereumPoolHandler,
      // [ChainType.SOLANA]: this.solanaPoolHandler,
    };
  }

  /**
   * Retrieves the appropriate handler for the specified chain type.
   * @param chainType - The chain type (e.g., ETHEREUM, SOLANA).
   * @returns The handler implementing the PoolHandlerInterface.
   * @throws NotFoundException if no handler exists for the given chain type.
   *
   * ### Example
   * ```typescript
   * const handler = poolHandlerFactory.getHandler(ChainType.ETHEREUM);
   * ```
   */
  getHandler(chainType: ChainType): PoolHandlerInterface<any, any> {
    const handler = this.handlers[chainType];
    if (!handler) {
      throw new NotFoundException(
        `Handler not found for chain type: ${chainType}`,
      );
    }
    return handler;
  }
}
