import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PoolHandlerFactory } from './pool-handler.factory';
import { ChainType } from './constants/pools.enums';
import { ValidateEthereumAddressDto } from './dtos/request/validate-ethereum-address.dto';
import { ValidateSolanaAddressDto } from './dtos/request/validate-solana-address.dto';
import { DataSource } from 'typeorm';
import { poolMap } from './constants/pool.utils';

@Injectable()
export class PoolsService {
  constructor(
    private readonly poolHandlerFactory: PoolHandlerFactory,
    private readonly dataSource: DataSource,
  ) {}

  async upsertPool(
    address: string,
    chainId: number,
    currentBlock: number,
  ): Promise<void> {
    // Validate address
    if (!address || typeof address !== 'string' || address.trim() === '') {
      throw new BadRequestException(
        'Address is required and must be a valid string.',
      );
    }

    // Validate chainId
    if (!chainId || typeof chainId !== 'number' || chainId <= 0) {
      throw new BadRequestException(
        'Invalid chainId. ChainId must be a positive number.',
      );
    }

    // Validate currentBlock
    if (
      currentBlock === null ||
      currentBlock === undefined ||
      currentBlock < 0
    ) {
      throw new BadRequestException(
        'Invalid block number. It must be a non-negative number.',
      );
    }

    const query = `
      INSERT INTO pools (address, chain_id, current_block)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE current_block = GREATEST(current_block, VALUES(current_block));
    `;

    await this.dataSource.query(query, [address, chainId, currentBlock]);
  }

  validateAddress(
    chainType: ChainType,
    dto: ValidateEthereumAddressDto | ValidateSolanaAddressDto,
  ): boolean {
    const handler = this.poolHandlerFactory.getHandler(chainType);
    const isValid = handler.validateAddress(dto);

    if (!isValid) {
      const chainTypeName =
        Object.keys(ChainType).find(
          (key) => ChainType[key as keyof typeof ChainType] === chainType,
        ) || 'UNKNOWN_CHAIN';
      throw new BadRequestException(
        `Address validation failed for chain type: ${chainTypeName}`,
      );
    }

    return isValid;
  }

  async getCurrentBlock(
    chainType: ChainType,
    address: string,
    chainId: number,
  ): Promise<number> {
    const handler = this.poolHandlerFactory.getHandler(chainType);
    return handler.getCurrentBlock(address, chainId);
  }

  async setCurrentBlock(
    chainType: ChainType,
    address: string,
    chainId: number,
    blockNumber: number,
  ): Promise<boolean> {
    if (!address || typeof address !== 'string') {
      throw new BadRequestException('Invalid address');
    }

    if (!chainId || typeof chainId !== 'number') {
      throw new BadRequestException('Invalid chainId');
    }

    if (blockNumber < 0 || typeof blockNumber !== 'number') {
      throw new BadRequestException('Invalid block number');
    }

    const handler = this.poolHandlerFactory.getHandler(chainType);
    return handler.setCurrentBlock(address, chainId, blockNumber);
  }

  /**
   * Get Pool By Address
   *
   * Retrieves the pool details for a given pool address using the `poolMap` lookup.
   *
   * --- Features ---
   * - **Ethereum-Specific Normalization:** Addresses are normalized to lowercase
   *   for Ethereum, which is case-insensitive. This behavior is designed specifically
   *   for Ethereum and will need refactoring when other chain types are supported.
   *
   * --- Limitations ---
   * - Currently supports only Ethereum addresses. Other blockchains, which might be
   *   case-sensitive, are not yet supported.
   *
   * --- Future Enhancements ---
   * - Refactor the normalization logic into a dedicated Ethereum service or handler
   *   when adding support for multiple blockchain types.
   * - Extend `poolMap` or use a dynamic data source (e.g., database) for scalability.
   *
   * @param address - The address of the pool (case-insensitive for Ethereum).
   * @returns The pool details if found in the `poolMap`.
   * @throws NotFoundException - If the pool is not found in the `poolMap` or if the address is invalid.
   */
  getPoolByAddress(address: string) {
    // Input Validation
    if (!address || typeof address !== 'string' || address.trim() === '') {
      throw new NotFoundException(`Pool not found for address: ${address}`);
    }

    // Ethereum specific normalization - to be refactored to ethereum service once other chains are implemented
    const normalizedAddress = address.toLowerCase();
    const pool = poolMap[normalizedAddress];

    if (!pool) {
      throw new NotFoundException(`Pool not found for address: ${address}`);
    }

    return pool;
  }
}
