import { Test, TestingModule } from '@nestjs/testing';
import { BasePoolHandlerService } from './base-pool-handler.service';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PoolEntity } from '../entities/pools.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BasePoolHandlerService', () => {
  let service: BasePoolHandlerService;
  let repository: Repository<PoolEntity>;
  let dataSource: DataSource;

  const mockPool = {
    id: 1,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: 1,
    currentBlock: 12345,
  };

  const mockRepository = {
    findOneBy: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BasePoolHandlerService,
        {
          provide: getRepositoryToken(PoolEntity),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<BasePoolHandlerService>(BasePoolHandlerService);
    repository = module.get<Repository<PoolEntity>>(
      getRepositoryToken(PoolEntity),
    );
    dataSource = module.get<DataSource>(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
    expect(dataSource).toBeDefined();
  });

  describe('getCurrentBlock', () => {
    it('should return the current block for a valid pool', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockPool);

      const result = await service.getCurrentBlock(
        mockPool.address,
        mockPool.chainId,
      );

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        address: mockPool.address,
        chainId: mockPool.chainId,
      });
      expect(result).toBe(mockPool.currentBlock);
    });

    it('should throw NotFoundException if the pool does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.getCurrentBlock(mockPool.address, mockPool.chainId),
      ).rejects.toThrow(
        new NotFoundException(
          `Pool not found for address ${mockPool.address} on chainId ${mockPool.chainId}`,
        ),
      );

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        address: mockPool.address,
        chainId: mockPool.chainId,
      });
    });

    it('should throw BadRequestException for invalid address input', async () => {
      await expect(
        service.getCurrentBlock(null as any, mockPool.chainId),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.findOneBy).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid chainId input - i.e. invalid address to chainId mapping', async () => {
      await expect(
        service.getCurrentBlock(mockPool.address, null as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setCurrentBlock', () => {
    const mockUpdateBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    it('should update the current block and return true if successful', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockUpdateBuilder);
      mockUpdateBuilder.execute.mockResolvedValue({ affected: 1 });

      const result = await service.setCurrentBlock(
        mockPool.address,
        mockPool.chainId,
        mockPool.currentBlock + 10,
      );

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockUpdateBuilder.update).toHaveBeenCalledWith(PoolEntity);
      expect(mockUpdateBuilder.set).toHaveBeenCalledWith({
        currentBlock: expect.any(Function),
      });
      expect(mockUpdateBuilder.where).toHaveBeenCalledWith(
        'address = :address AND chainId = :chainId',
        {
          address: mockPool.address.toLowerCase(),
          chainId: mockPool.chainId,
        },
      );
      expect(mockUpdateBuilder.execute).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if no rows were updated', async () => {
      mockRepository.createQueryBuilder.mockReturnValue(mockUpdateBuilder);
      mockUpdateBuilder.execute.mockResolvedValue({ affected: 0 });

      const result = await service.setCurrentBlock(
        mockPool.address,
        mockPool.chainId,
        mockPool.currentBlock - 10,
      );

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockUpdateBuilder.execute).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should throw BadRequestException for invalid address input', async () => {
      await expect(
        service.setCurrentBlock(null as any, mockPool.chainId, 12345),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid block number', async () => {
      await expect(
        service.setCurrentBlock(mockPool.address, mockPool.chainId, -1),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid chainId input (null for chain input)', async () => {
      await expect(
        service.setCurrentBlock(mockPool.address, null as any, 12345),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
