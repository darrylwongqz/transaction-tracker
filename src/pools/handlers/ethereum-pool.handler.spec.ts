import { BadRequestException } from '@nestjs/common';
import { CHAIN_MAP } from '../constants/pools.constants';
import {
  EthereumAddress,
  ValidateEthereumAddressDto,
} from '../dtos/request/validate-ethereum-address.dto';
import { BasePoolHandlerService } from './base-pool-handler.service';
import { EthereumPoolHandler } from './ethereum-pool.handler';

describe('EthereumPoolHandler', () => {
  let handler: EthereumPoolHandler;
  let mockBasePoolHandlerService: BasePoolHandlerService;

  beforeEach(() => {
    mockBasePoolHandlerService = {
      getCurrentBlock: jest.fn(),
      setCurrentBlock: jest.fn(),
    } as unknown as BasePoolHandlerService;

    handler = new EthereumPoolHandler(mockBasePoolHandlerService);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('validateAddress', () => {
    it('should validate a correct Ethereum address and chainId', () => {
      const dto: ValidateEthereumAddressDto = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: CHAIN_MAP.ETHEREUM_MAINNET,
      };

      expect(handler.validateAddress(dto)).toBe(true);
    });

    it('should throw BadRequestException for unsupported chainId', () => {
      const dto: ValidateEthereumAddressDto = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 999,
      };

      expect(() => handler.validateAddress(dto)).toThrowError(
        BadRequestException,
      );
      expect(() => handler.validateAddress(dto)).toThrowError(
        `Unsupported chainId for Ethereum: ${dto.chainId}`,
      );
    });

    it('should validate a lowercase Ethereum address', () => {
      const dto: ValidateEthereumAddressDto = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: CHAIN_MAP.ETHEREUM_MAINNET,
      };

      expect(handler.validateAddress(dto)).toBe(true);
    });

    it('should return true for a mixed-case Ethereum address', () => {
      const dto: ValidateEthereumAddressDto = {
        address: '0x1234567890ABCDEF1234567890ABCDEF12345678',
        chainId: CHAIN_MAP.ETHEREUM_MAINNET,
      };

      expect(handler.validateAddress(dto)).toBe(true);
    });
  });

  describe('getCurrentBlock', () => {
    it('should return the current block for a valid address and chainId', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = CHAIN_MAP.ETHEREUM_MAINNET;
      const currentBlock = 12345;

      (
        mockBasePoolHandlerService.getCurrentBlock as jest.Mock
      ).mockResolvedValue(currentBlock);

      const result = await handler.getCurrentBlock(address, chainId);

      expect(mockBasePoolHandlerService.getCurrentBlock).toHaveBeenCalledWith(
        address.toLowerCase(),
        chainId,
      );
      expect(result).toBe(currentBlock);
    });

    it('should throw BadRequestException for unsupported chainId', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 999;

      await expect(
        handler.getCurrentBlock(address, chainId),
      ).rejects.toThrowError(BadRequestException);
      await expect(
        handler.getCurrentBlock(address, chainId),
      ).rejects.toThrowError(`Unsupported chainId for Ethereum: ${chainId}`);
    });
  });

  describe('setCurrentBlock', () => {
    it('should update the current block and return true for valid input', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = CHAIN_MAP.ETHEREUM_MAINNET;
      const blockNumber = 12346;

      (
        mockBasePoolHandlerService.setCurrentBlock as jest.Mock
      ).mockResolvedValue(true);

      const result = await handler.setCurrentBlock(
        address,
        chainId,
        blockNumber,
      );

      expect(mockBasePoolHandlerService.setCurrentBlock).toHaveBeenCalledWith(
        address.toLowerCase(),
        chainId,
        blockNumber,
      );
      expect(result).toBe(true);
    });

    it('should throw BadRequestException for unsupported chainId', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 999;
      const blockNumber = 12346;

      await expect(
        handler.setCurrentBlock(address, chainId, blockNumber),
      ).rejects.toThrowError(BadRequestException);
      await expect(
        handler.setCurrentBlock(address, chainId, blockNumber),
      ).rejects.toThrowError(`Unsupported chainId for Ethereum: ${chainId}`);
    });

    it('should throw BadRequestException for invalid block number', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = CHAIN_MAP.ETHEREUM_MAINNET;
      const blockNumber = -1;

      await expect(
        handler.setCurrentBlock(address, chainId, blockNumber),
      ).rejects.toThrowError(BadRequestException);
      await expect(
        handler.setCurrentBlock(address, chainId, blockNumber),
      ).rejects.toThrowError(
        `Invalid block number: ${blockNumber}. Block number must be a non-negative value.`,
      );
    });
  });
});
