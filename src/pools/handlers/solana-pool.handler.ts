import { BadRequestException } from '@nestjs/common';
import {
  SolanaAddress,
  ValidateSolanaAddressDto,
} from '../dtos/request/validate-solana-address.dto';
import { PoolHandlerInterface } from '../interfaces/pool-handler.interface';
import { BasePoolHandlerService } from './base-pool-handler.service';
import { CHAIN_MAP } from '../../common/constants';

/**
 * SolanaPoolHandler is an illustrative implementation of the PoolHandlerInterface
 * for the Solana blockchain. This handler demonstrates how similar functionality
 * can be implemented for non-Ethereum blockchains.
 *
 * Note:
 * - This class is only for illustrative purposes and does not include actual
 *   Solana-specific logic or API calls.
 * - A real-world implementation would require integration with Solana's RPC
 *   endpoints to fetch and set block-related data.
 * - Extend or replace the methods with Solana-specific logic as needed.
 */
export class SolanaPoolHandler
  implements PoolHandlerInterface<ValidateSolanaAddressDto, SolanaAddress>
{
  constructor(
    private readonly basePoolHandlerService: BasePoolHandlerService,
  ) {}

  private readonly supportedChainIds = [CHAIN_MAP.SOLANA_MAINNET]; // Example Solana Mainnet chain ID

  /**
   * Validates the Solana address.
   * @param dto - DTO containing the address and chain ID.
   * @returns {boolean} - True if the address is valid; otherwise, throws an error.
   */
  validateAddress(dto: ValidateSolanaAddressDto): boolean {
    if (!this.supportedChainIds.includes(dto.chainId)) {
      throw new BadRequestException(
        `Unsupported chainId for Solana: ${dto.chainId}`,
      );
    }
    return true;
  }

  /**
   * Retrieves the current block for the given pool address and chain ID.
   * Note: Replace with actual Solana-specific logic.
   * @param address - The Solana pool address.
   * @param chainId - The chain ID.
   * @returns {Promise<number>} - The current block number.
   */
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

  /**
   * Sets the current block for the given pool address and chain ID.
   * Note: Replace with actual Solana-specific logic.
   * @param address - The Solana pool address.
   * @param chainId - The chain ID.
   * @param blockNumber - The block number to set.
   * @returns {Promise<boolean>} - True if the block number was successfully set.
   */
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
