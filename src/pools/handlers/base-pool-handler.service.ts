import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PoolEntity } from '../entities/pools.entity';

/**
 * BasePoolHandlerService
 *
 * This service provides common functionality for managing and interacting
 * with pools across different blockchains. It serves as a foundational service
 * that can be utilized by blockchain-specific handlers, such as Ethereum or Solana pool handlers.
 *
 * --- Features ---
 * - Fetch the current synchronization block of a pool for a given address and chain ID.
 * - Update the current synchronization block for a pool, ensuring that only newer blocks are saved.
 * - Validation of pool address, chain ID, and block number inputs.
 *
 * --- Usage ---
 * Inject this service into chain-specific pool handlers or other services to:
 * - Retrieve the current block number of a pool for synchronization purposes.
 * - Update the current block number when processing new transactions.
 *
 * --- Future Enhancements ---
 * - Add caching mechanisms to reduce database query load for frequently accessed pools.
 * - Implement additional validation logic for addresses, tailored to specific blockchain formats.
 * - Extend functionality to support pool metadata management, such as token pairs or fees.
 */
@Injectable()
export class BasePoolHandlerService {
  constructor(
    @InjectRepository(PoolEntity)
    private readonly poolRepository: Repository<PoolEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Retrieves the current block number for a given pool address and chain ID.
   *
   * @param address - The unique address of the pool on the blockchain.
   * @param chainId - The chain ID where the pool resides.
   * @returns {Promise<number>} - The current synchronization block number.
   * @throws {BadRequestException} - If the address is invalid.
   * @throws {NotFoundException} - If the pool does not exist for the given address and chain ID.
   */
  async getCurrentBlock(address: string, chainId: number): Promise<number> {
    if (!address || typeof address !== 'string') {
      throw new BadRequestException('Invalid address');
    }

    const pool = await this.poolRepository.findOneBy({
      address,
      chainId,
    });

    if (!pool) {
      throw new NotFoundException(
        `Pool not found for address ${address} on chainId ${chainId}`,
      );
    }

    return pool.currentBlock;
  }

  /**
   * Updates the current block number for a given pool address and chain ID.
   *
   * Ensures that the block number is only updated if it is greater than the
   * existing block number, using a database-level `GREATEST` function.
   *
   * @param address - The unique address of the pool on the blockchain.
   * @param chainId - The chain ID where the pool resides.
   * @param blockNumber - The new block number to update.
   * @returns {Promise<boolean>} - True if the block number was updated, false otherwise.
   * @throws {BadRequestException} - If the address, chain ID, or block number is invalid.
   */
  async setCurrentBlock(
    address: string,
    chainId: number,
    blockNumber: number,
  ): Promise<boolean> {
    if (!address) {
      throw new BadRequestException('Invalid address');
    }

    if (!chainId) {
      throw new BadRequestException('Invalid chainId');
    }

    if (blockNumber < 0) {
      throw new BadRequestException('Invalid block number');
    }

    const result = await this.poolRepository
      .createQueryBuilder()
      .update(PoolEntity)
      .set({ currentBlock: () => `GREATEST(currentBlock, ${blockNumber})` })
      .where('address = :address AND chainId = :chainId', {
        address: address.toLowerCase(),
        chainId,
      })
      .execute();

    return result.affected > 0;
  }
}
