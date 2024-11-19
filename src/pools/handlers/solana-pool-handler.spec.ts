import { BadRequestException } from '@nestjs/common';
import {
  SolanaAddress,
  ValidateSolanaAddressDto,
} from '../dtos/request/validate-solana-address.dto';
import { BasePoolHandlerService } from './base-pool-handler.service';
import { SolanaPoolHandler } from './solana-pool.handler';

describe('SolanaPoolHandler', () => {
  let handler: SolanaPoolHandler;
  let basePoolHandlerService: BasePoolHandlerService;

  const mockBasePoolHandlerService = {
    getCurrentBlock: jest.fn(),
    setCurrentBlock: jest.fn(),
  };

  beforeEach(() => {
    basePoolHandlerService =
      mockBasePoolHandlerService as unknown as BasePoolHandlerService;
    handler = new SolanaPoolHandler(basePoolHandlerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('validateAddress', () => {
    // it('should validate a correct Solana address and chainId', () => {
    //   const dto: ValidateSolanaAddressDto = {
    //     address: '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH',
    //     chainId: CHAIN_MAP.SOLANA_MAINNET,
    //   };

    //   const result = handler.validateAddress(dto);

    //   expect(result).toBe(true);
    // });

    it('should throw a BadRequestException for unsupported chainId', () => {
      const dto: ValidateSolanaAddressDto = {
        address: '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH',
        chainId: 999, // Unsupported chainId
      };

      expect(() => handler.validateAddress(dto)).toThrowError(
        new BadRequestException(
          `Unsupported chainId for Solana: ${dto.chainId}`,
        ),
      );
    });
  });

  describe('getCurrentBlock', () => {
    // it('should return the current block for a valid address and chainId', async () => {
    //   const address: SolanaAddress =
    //     '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH';
    //   const chainId = CHAIN_MAP.SOLANA_MAINNET;
    //   const currentBlock = 123456;

    //   mockBasePoolHandlerService.getCurrentBlock.mockResolvedValue(
    //     currentBlock,
    //   );

    //   const result = await handler.getCurrentBlock(address, chainId);

    //   expect(mockBasePoolHandlerService.getCurrentBlock).toHaveBeenCalledWith(
    //     address,
    //     chainId,
    //   );
    //   expect(result).toBe(currentBlock);
    // });

    it('should throw a BadRequestException for unsupported chainId', async () => {
      const address: SolanaAddress =
        '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH';
      const chainId = 999; // Unsupported chainId

      await expect(
        handler.getCurrentBlock(address, chainId),
      ).rejects.toThrowError(
        new BadRequestException(`Unsupported chainId for Solana: ${chainId}`),
      );

      expect(mockBasePoolHandlerService.getCurrentBlock).not.toHaveBeenCalled();
    });
  });

  describe('setCurrentBlock', () => {
    // it('should update the current block and return true for valid parameters', async () => {
    //   const address: SolanaAddress =
    //     '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH';
    //   const chainId = CHAIN_MAP.SOLANA_MAINNET;
    //   const blockNumber = 123456;

    //   mockBasePoolHandlerService.setCurrentBlock.mockResolvedValue(true);

    //   const result = await handler.setCurrentBlock(
    //     address,
    //     chainId,
    //     blockNumber,
    //   );

    //   expect(mockBasePoolHandlerService.setCurrentBlock).toHaveBeenCalledWith(
    //     address,
    //     chainId,
    //     blockNumber,
    //   );
    //   expect(result).toBe(true);
    // });

    it('should throw a BadRequestException for unsupported chainId', async () => {
      const address: SolanaAddress =
        '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH';
      const chainId = 999; // Unsupported chainId
      const blockNumber = 123456;

      await expect(
        handler.setCurrentBlock(address, chainId, blockNumber),
      ).rejects.toThrowError(
        new BadRequestException(`Unsupported chainId for Solana: ${chainId}`),
      );

      expect(mockBasePoolHandlerService.setCurrentBlock).not.toHaveBeenCalled();
    });

    // it('should throw a BadRequestException for invalid block number', async () => {
    //   const address: SolanaAddress =
    //     '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH';
    //   const chainId = CHAIN_MAP.SOLANA_MAINNET;
    //   const blockNumber = -1; // Invalid block number

    //   await expect(
    //     handler.setCurrentBlock(address, chainId, blockNumber),
    //   ).rejects.toThrowError(
    //     new BadRequestException(
    //       `Invalid block number: ${blockNumber}. Block number must be a non-negative value.`,
    //     ),
    //   );

    //   expect(mockBasePoolHandlerService.setCurrentBlock).not.toHaveBeenCalled();
    // });
  });
});
