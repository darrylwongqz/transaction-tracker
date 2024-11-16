import { Test, TestingModule } from '@nestjs/testing';
import { PoolsService } from './pools.service';
import { PoolHandlerFactory } from './pool-handler.factory';
import { ChainType } from './constants/pools.enums';
import { ValidateEthereumAddressDto } from './dtos/request/validate-ethereum-address.dto';
import { ValidateSolanaAddressDto } from './dtos/request/validate-solana-address.dto';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PoolsService', () => {
  let service: PoolsService;
  let handlerFactory: PoolHandlerFactory;
  let dataSource: DataSource;

  const mockDataSource = {
    query: jest.fn(),
  };

  const mockHandlerFactory = {
    getHandler: jest.fn(),
  };

  const mockEthereumHandler = {
    validateAddress: jest.fn(),
    getCurrentBlock: jest.fn(),
    setCurrentBlock: jest.fn(),
  };

  const mockSolanaHandler = {
    validateAddress: jest.fn(),
    getCurrentBlock: jest.fn(),
    setCurrentBlock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolsService,
        {
          provide: PoolHandlerFactory,
          useValue: mockHandlerFactory,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<PoolsService>(PoolsService);
    handlerFactory = module.get<PoolHandlerFactory>(PoolHandlerFactory);
    dataSource = module.get<DataSource>(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsertPool', () => {
    it('should execute the upsert query correctly', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 1;
      const currentBlock = 12345;

      mockDataSource.query.mockResolvedValueOnce({});

      await service.upsertPool(address, chainId, currentBlock);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'INSERT INTO pools (address, chain_id, current_block)',
        ),
        [address, chainId, currentBlock],
      );
    });

    it('should throw BadRequestException for null address', async () => {
      await expect(service.upsertPool(null as any, 1, 12345)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.upsertPool(null as any, 1, 12345)).rejects.toThrow(
        'Address is required and must be a valid string.',
      );
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty address', async () => {
      await expect(service.upsertPool('', 1, 12345)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.upsertPool('', 1, 12345)).rejects.toThrow(
        'Address is required and must be a valid string.',
      );
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for null chainId', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      await expect(
        service.upsertPool(address, null as any, 12345),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.upsertPool(address, null as any, 12345),
      ).rejects.toThrow('Invalid chainId. ChainId must be a positive number.');
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid chainId', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      await expect(service.upsertPool(address, -1, 12345)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.upsertPool(address, -1, 12345)).rejects.toThrow(
        'Invalid chainId. ChainId must be a positive number.',
      );
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for null block number', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      await expect(service.upsertPool(address, 1, null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.upsertPool(address, 1, null as any)).rejects.toThrow(
        'Invalid block number. It must be a non-negative number.',
      );
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    it('should ignore duplicate entries using ON DUPLICATE KEY', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 1;
      const currentBlock = 12345;

      mockDataSource.query.mockResolvedValueOnce({});

      await service.upsertPool(address, chainId, currentBlock);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'INSERT INTO pools (address, chain_id, current_block)',
        ),
        [address, chainId, currentBlock],
      );
    });

    it('should throw an error if the database query fails', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 1;
      const currentBlock = 12345;

      mockDataSource.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        service.upsertPool(address, chainId, currentBlock),
      ).rejects.toThrow('Database error');
    });

    it('should handle mixed-case addresses correctly', async () => {
      const mixedCaseAddress = '0x1234567890AbCdEf1234567890ABCdEF12345678';
      const chainId = 1;
      const currentBlock = 12345;

      mockDataSource.query.mockResolvedValueOnce({});

      await service.upsertPool(mixedCaseAddress, chainId, currentBlock);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'INSERT INTO pools (address, chain_id, current_block)',
        ),
        [mixedCaseAddress, chainId, currentBlock],
      );
    });
  });
  describe('validateAddress', () => {
    it('should call the correct handler to validate Ethereum address', () => {
      const dto: ValidateEthereumAddressDto = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      };
      mockHandlerFactory.getHandler.mockReturnValue(mockEthereumHandler);
      mockEthereumHandler.validateAddress.mockReturnValue(true);

      const result = service.validateAddress(ChainType.ETHEREUM, dto);

      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        ChainType.ETHEREUM,
      );
      expect(mockEthereumHandler.validateAddress).toHaveBeenCalledWith(dto);
      expect(result).toBe(true);
    });

    it('should call the correct handler to validate Solana address', () => {
      const dto: ValidateSolanaAddressDto = {
        address: '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH',
        chainId: 101,
      };
      mockHandlerFactory.getHandler.mockReturnValue(mockSolanaHandler);
      mockSolanaHandler.validateAddress.mockReturnValue(true);

      const result = service.validateAddress(ChainType.SOLANA, dto);

      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        ChainType.SOLANA,
      );
      expect(mockSolanaHandler.validateAddress).toHaveBeenCalledWith(dto);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException if no handler is found for the chain type', () => {
      const dto: ValidateEthereumAddressDto = {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chainId: 1,
      };
      mockHandlerFactory.getHandler.mockImplementation(() => {
        throw new NotFoundException(
          'Handler not found for chain type: UNSUPPORTED_CHAIN',
        );
      });

      expect(() =>
        service.validateAddress(ChainType.ETHEREUM, dto),
      ).toThrowError(NotFoundException);
      expect(() =>
        service.validateAddress(ChainType.ETHEREUM, dto),
      ).toThrowError('Handler not found for chain type: UNSUPPORTED_CHAIN');
    });

    it('should throw BadRequestException if the handler returns false for validation', () => {
      const dto: ValidateEthereumAddressDto = {
        address: '0xInvalidEthereumAddress',
        chainId: 1,
      };

      mockHandlerFactory.getHandler.mockReturnValue(mockEthereumHandler);
      mockEthereumHandler.validateAddress.mockReturnValue(false);

      expect(() =>
        service.validateAddress(ChainType.ETHEREUM, dto),
      ).toThrowError(BadRequestException);
      expect(() =>
        service.validateAddress(ChainType.ETHEREUM, dto),
      ).toThrowError('Address validation failed for chain type: ETHEREUM');
    });

    it('should throw BadRequestException if the input DTO is invalid', () => {
      const invalidDto: any = {
        address: null,
        chainId: null,
      };

      mockHandlerFactory.getHandler.mockReturnValue(mockEthereumHandler);
      mockEthereumHandler.validateAddress.mockImplementation(() => {
        throw new BadRequestException('Invalid DTO');
      });

      expect(() =>
        service.validateAddress(ChainType.ETHEREUM, invalidDto),
      ).toThrowError(BadRequestException);
      expect(() =>
        service.validateAddress(ChainType.ETHEREUM, invalidDto),
      ).toThrowError('Invalid DTO');
    });
  });

  describe('getCurrentBlock', () => {
    it('should call the correct handler to get the current block for Ethereum', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 1;
      const currentBlock = 12345;

      mockHandlerFactory.getHandler.mockReturnValue(mockEthereumHandler);
      mockEthereumHandler.getCurrentBlock.mockResolvedValue(currentBlock);

      const result = await service.getCurrentBlock(
        ChainType.ETHEREUM,
        address,
        chainId,
      );

      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        ChainType.ETHEREUM,
      );
      expect(mockEthereumHandler.getCurrentBlock).toHaveBeenCalledWith(
        address,
        chainId,
      );
      expect(result).toBe(currentBlock);
    });

    it('should call the correct handler to get the current block for Solana', async () => {
      const address = '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH';
      const chainId = 101;
      const currentBlock = 78910;

      mockHandlerFactory.getHandler.mockReturnValue(mockSolanaHandler);
      mockSolanaHandler.getCurrentBlock.mockResolvedValue(currentBlock);

      const result = await service.getCurrentBlock(
        ChainType.SOLANA,
        address,
        chainId,
      );

      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        ChainType.SOLANA,
      );
      expect(mockSolanaHandler.getCurrentBlock).toHaveBeenCalledWith(
        address,
        chainId,
      );
      expect(result).toBe(currentBlock);
    });

    it('should throw an error if no handler is found for the chain type', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 1;

      mockHandlerFactory.getHandler.mockImplementation(() => {
        throw new Error('No handler found for chain type: UNSUPPORTED_CHAIN');
      });

      await expect(
        service.getCurrentBlock(ChainType.ETHEREUM, address, chainId),
      ).rejects.toThrowError(
        'No handler found for chain type: UNSUPPORTED_CHAIN',
      );
    });

    it('should throw NotFoundException if the handler does not find the pool', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 1;

      mockHandlerFactory.getHandler.mockReturnValue(mockEthereumHandler);
      mockEthereumHandler.getCurrentBlock.mockImplementation(() => {
        throw new NotFoundException('Pool not found');
      });

      await expect(
        service.getCurrentBlock(ChainType.ETHEREUM, address, chainId),
      ).rejects.toThrowError(NotFoundException);
      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        ChainType.ETHEREUM,
      );
      expect(mockEthereumHandler.getCurrentBlock).toHaveBeenCalledWith(
        address,
        chainId,
      );
    });

    it('should throw BadRequestException for invalid input', async () => {
      const address = '';
      const chainId = null;

      mockHandlerFactory.getHandler.mockReturnValue(mockEthereumHandler);
      mockEthereumHandler.getCurrentBlock.mockImplementation(() => {
        throw new Error('Invalid input');
      });

      await expect(
        service.getCurrentBlock(ChainType.ETHEREUM, address, chainId as any),
      ).rejects.toThrowError('Invalid input');
      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        ChainType.ETHEREUM,
      );
      expect(mockEthereumHandler.getCurrentBlock).toHaveBeenCalledWith(
        address,
        chainId,
      );
    });
  });

  describe('setCurrentBlock', () => {
    it('should call the correct handler to set the current block for Ethereum', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 1;
      const blockNumber = 12346;

      mockHandlerFactory.getHandler.mockReturnValue(mockEthereumHandler);
      mockEthereumHandler.setCurrentBlock.mockResolvedValue(true);

      const result = await service.setCurrentBlock(
        ChainType.ETHEREUM,
        address,
        chainId,
        blockNumber,
      );

      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        ChainType.ETHEREUM,
      );
      expect(mockEthereumHandler.setCurrentBlock).toHaveBeenCalledWith(
        address,
        chainId,
        blockNumber,
      );
      expect(result).toBe(true);
    });

    it('should call the correct handler to set the current block for Solana', async () => {
      const address = '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH';
      const chainId = 101;
      const blockNumber = 98765;

      mockHandlerFactory.getHandler.mockReturnValue(mockSolanaHandler);
      mockSolanaHandler.setCurrentBlock.mockResolvedValue(true);

      const result = await service.setCurrentBlock(
        ChainType.SOLANA,
        address,
        chainId,
        blockNumber,
      );

      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        ChainType.SOLANA,
      );
      expect(mockSolanaHandler.setCurrentBlock).toHaveBeenCalledWith(
        address,
        chainId,
        blockNumber,
      );
      expect(result).toBe(true);
    });

    it('should throw a NotFoundException if no handler is found for the chain type', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 1;
      const blockNumber = 12346;

      mockHandlerFactory.getHandler.mockImplementation(() => {
        throw new NotFoundException('No handler found for chain type');
      });

      await expect(
        service.setCurrentBlock(
          ChainType.ETHEREUM,
          address,
          chainId,
          blockNumber,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        ChainType.ETHEREUM,
      );
      expect(mockEthereumHandler.setCurrentBlock).not.toHaveBeenCalled();
    });

    it('should throw an error if the handler fails to set the block', async () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const chainId = 1;
      const blockNumber = 12346;

      mockHandlerFactory.getHandler.mockReturnValue(mockEthereumHandler);
      mockEthereumHandler.setCurrentBlock.mockRejectedValue(
        new Error('Failed to set block'),
      );

      await expect(
        service.setCurrentBlock(
          ChainType.ETHEREUM,
          address,
          chainId,
          blockNumber,
        ),
      ).rejects.toThrow('Failed to set block');

      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        ChainType.ETHEREUM,
      );
      expect(mockEthereumHandler.setCurrentBlock).toHaveBeenCalledWith(
        address,
        chainId,
        blockNumber,
      );
    });

    it('should handle unsupported chain types gracefully', async () => {
      const address = 'unsupported_address';
      const chainId = 999; // Unsupported chain ID
      const blockNumber = 12346;

      mockHandlerFactory.getHandler.mockImplementation(() => {
        throw new NotFoundException('Unsupported chain type');
      });

      await expect(
        service.setCurrentBlock(
          'unsupported-chain-type' as unknown as ChainType,
          address,
          chainId,
          blockNumber,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mockHandlerFactory.getHandler).toHaveBeenCalledWith(
        'unsupported-chain-type',
      );
    });
  });
});
