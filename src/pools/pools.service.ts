import { BadRequestException, Injectable } from '@nestjs/common';
import { PoolHandlerFactory } from './pool-handler.factory';
import { ChainType } from './constants/pools.enums';
import { ValidateEthereumAddressDto } from './dtos/request/validate-ethereum-address.dto';
import { ValidateSolanaAddressDto } from './dtos/request/validate-solana-address.dto';
import { DataSource } from 'typeorm';

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
    const handler = this.poolHandlerFactory.getHandler(chainType);
    return handler.setCurrentBlock(address, chainId, blockNumber);
  }
}
