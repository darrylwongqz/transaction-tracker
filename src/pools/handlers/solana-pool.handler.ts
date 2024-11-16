import { BadRequestException } from '@nestjs/common';
import { CHAIN_MAP } from '../constants/pools.constants';
import {
  SolanaAddress,
  ValidateSolanaAddressDto,
} from '../dtos/request/validate-solana-address.dto';
import { PoolHandlerInterface } from '../interfaces/pool-handler.interface';
import { BasePoolHandlerService } from './base-pool-handler.service';

export class SolanaPoolHandler
  implements PoolHandlerInterface<ValidateSolanaAddressDto, SolanaAddress>
{
  constructor(
    private readonly basePoolHandlerService: BasePoolHandlerService,
  ) {}

  private readonly supportedChainIds = [CHAIN_MAP.SOLANA_MAINNET]; // Example Solana Mainnet chain ID

  validateAddress(dto: ValidateSolanaAddressDto): boolean {
    if (!this.supportedChainIds.includes(dto.chainId)) {
      throw new BadRequestException(
        `Unsupported chainId for Solana: ${dto.chainId}`,
      );
    }
    return true;
  }

  async getCurrentBlock(
    address: SolanaAddress,
    chainId: number,
  ): Promise<number> {
    if (!this.supportedChainIds.includes(chainId)) {
      throw new BadRequestException(
        `Unsupported chainId for Solana: ${chainId}`,
      );
    }
    return this.basePoolHandlerService.getCurrentBlock(address, chainId);
  }

  async setCurrentBlock(
    address: SolanaAddress,
    chainId: number,
    blockNumber: number,
  ): Promise<boolean> {
    if (!this.supportedChainIds.includes(chainId)) {
      throw new BadRequestException(
        `Unsupported chainId for Solana: ${chainId}`,
      );
    }

    if (blockNumber < 0) {
      throw new BadRequestException(
        `Invalid block number: ${blockNumber}. Block number must be a non-negative value.`,
      );
    }

    return this.basePoolHandlerService.setCurrentBlock(
      address,
      chainId,
      blockNumber,
    );
  }
}
