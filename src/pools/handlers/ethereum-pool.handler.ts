import { CHAIN_MAP } from '../constants/pools.constants';
import {
  EthereumAddress,
  ValidateEthereumAddressDto,
} from '../dtos/request/validate-ethereum-address.dto';
import { PoolHandlerInterface } from '../interfaces/pool-handler.interface';
import { BasePoolHandlerService } from './base-pool-handler.service';
import { BadRequestException } from '@nestjs/common';

export class EthereumPoolHandler
  implements PoolHandlerInterface<ValidateEthereumAddressDto, EthereumAddress>
{
  constructor(
    private readonly basePoolHandlerService: BasePoolHandlerService,
  ) {}

  private readonly supportedChainIds = [CHAIN_MAP.ETHEREUM_MAINNET]; // Ethereum Mainnet - extendable for testnets

  validateAddress(dto: ValidateEthereumAddressDto): boolean {
    if (!this.supportedChainIds.includes(dto.chainId)) {
      throw new BadRequestException(
        `Unsupported chainId for Ethereum: ${dto.chainId}`,
      );
    }

    // Validate Ethereum address format (normalized to lowercase)
    const normalizedAddress = dto.address.toLowerCase();
    return normalizedAddress === dto.address.toLowerCase();
  }

  async getCurrentBlock(
    address: EthereumAddress,
    chainId: number,
  ): Promise<number> {
    if (!this.supportedChainIds.includes(chainId)) {
      throw new BadRequestException(
        `Unsupported chainId for Ethereum: ${chainId}`,
      );
    }

    // Normalize the address to lowercase and fetch the current block
    const normalizedAddress = address.toLowerCase();
    return this.basePoolHandlerService.getCurrentBlock(
      normalizedAddress,
      chainId,
    );
  }

  async setCurrentBlock(
    address: EthereumAddress,
    chainId: number,
    blockNumber: number,
  ): Promise<boolean> {
    if (!this.supportedChainIds.includes(chainId)) {
      throw new BadRequestException(
        `Unsupported chainId for Ethereum: ${chainId}`,
      );
    }

    if (blockNumber < 0) {
      throw new BadRequestException(
        `Invalid block number: ${blockNumber}. Block number must be a non-negative value.`,
      );
    }

    // Normalize the address to lowercase and update the block
    const normalizedAddress = address.toLowerCase();
    return this.basePoolHandlerService.setCurrentBlock(
      normalizedAddress,
      chainId,
      blockNumber,
    );
  }
}
