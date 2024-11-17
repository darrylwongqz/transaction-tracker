import { CHAIN_MAP } from '../../common/constants';
import {
  EthereumAddress,
  ValidateEthereumAddressDto,
} from '../dtos/request/validate-ethereum-address.dto';
import { PoolHandlerInterface } from '../interfaces/pool-handler.interface';
import { BasePoolHandlerService } from './base-pool-handler.service';
import { BadRequestException } from '@nestjs/common';

/**
 * EthereumPoolHandler
 *
 * This class is responsible for handling Ethereum-specific pool operations.
 * It implements the PoolHandlerInterface to provide methods for validating
 * Ethereum pool addresses and managing block synchronization.
 *
 * --- Features ---
 * - Validation of Ethereum addresses based on the provided chain ID.
 * - Support for multiple Ethereum networks (e.g., mainnet, testnets) via
 *   the `supportedChainIds` array.
 * - Integration with a base pool handler service for fetching and updating
 *   block synchronization data.
 *
 * --- Usage ---
 * Instantiate this class with a BasePoolHandlerService instance to enable
 * Ethereum-specific pool operations. Extend the `supportedChainIds` array
 * to include additional Ethereum networks as needed.
 *
 * --- Future Enhancements ---
 * - Add support for additional Ethereum networks (e.g., Goerli, Sepolia).
 * - Customize the validation logic for addresses based on network requirements.
 * - Implement enhanced logging for better traceability.
 */
export class EthereumPoolHandler
  implements PoolHandlerInterface<ValidateEthereumAddressDto, EthereumAddress>
{
  constructor(
    private readonly basePoolHandlerService: BasePoolHandlerService,
  ) {}

  /**
   * Chain IDs supported by this handler. Extendable to include testnets.
   */
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

  /**
   * Fetches the current block number for a given Ethereum pool address.
   *
   * @param address - The Ethereum pool address.
   * @param chainId - The chain ID (e.g., Ethereum Mainnet).
   * @returns {Promise<number>} - The current block number.
   * @throws {BadRequestException} - If the chain ID is unsupported.
   */
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

  /**
   * Updates the current block number for a given Ethereum pool address.
   *
   * @param address - The Ethereum pool address.
   * @param chainId - The chain ID (e.g., Ethereum Mainnet).
   * @param blockNumber - The new block number.
   * @returns {Promise<boolean>} - True if the block number was successfully updated.
   * @throws {BadRequestException} - If the chain ID is unsupported or block number is invalid.
   */
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
