import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsQueryDto } from './dtos/request/transaction-query.dto';
import { TransactionHashDto } from './dtos/request/transaction-hash.dto';
import { PaginatedTransactionsResponseDto } from './dtos/response/paginated-transactions-response.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SupportedChainQueryDto } from './dtos/request/supported-chain-query.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: TransactionsService;

  const mockTransactionsService = {
    getTransactions: jest.fn(),
    getTransactionByHash: jest.fn(),
  };

  const mockTransaction = {
    hash: '0x125e0b641d4a4b08806bf52c0c6757648c9963bcda8681e4f996f09e00d4c2cc',
    blockNumber: 12345678,
    timestamp: 1620250931,
    transactionFee: 1139.6453122208,
    chainId: 1,
  };

  const mockPaginatedResponse: PaginatedTransactionsResponseDto = {
    total: 1,
    limit: 10,
    skip: 0,
    results: [mockTransaction],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    transactionsService = module.get<TransactionsService>(TransactionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTransactions', () => {
    it('should return a paginated list of transactions', async () => {
      jest
        .spyOn(transactionsService, 'getTransactions')
        .mockResolvedValue(mockPaginatedResponse);

      const query: TransactionsQueryDto = {
        startTime: 1610000000,
        endTime: 1620000000,
        limit: 10,
        skip: 0,
        chainId: 1,
      };

      const result = await controller.getTransactions(query);

      expect(result).toEqual(mockPaginatedResponse);
      expect(transactionsService.getTransactions).toHaveBeenCalledWith(query);
      expect(transactionsService.getTransactions).toHaveBeenCalledTimes(1);
    });

    it('should default chainId to 1 if not provided', async () => {
      const query: TransactionsQueryDto = {
        startTime: 1610000000,
        endTime: 1620000000,
        limit: 10,
        skip: 0,
      };

      jest
        .spyOn(transactionsService, 'getTransactions')
        .mockResolvedValue(mockPaginatedResponse);

      const result = await controller.getTransactions(query);

      // Ensure the default chainId is applied
      expect(transactionsService.getTransactions).toHaveBeenCalledWith({
        ...query,
        chainId: 1, // Default chainId
      });
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should throw BadRequestException for invalid query params', async () => {
      const invalidQuery: TransactionsQueryDto = {
        startTime: null,
        endTime: null,
        limit: 10,
        skip: 0,
      };

      jest
        .spyOn(transactionsService, 'getTransactions')
        .mockRejectedValue(
          new BadRequestException(
            'Invalid query parameters: startTime and endTime are required',
          ),
        );

      await expect(controller.getTransactions(invalidQuery)).rejects.toThrow(
        BadRequestException,
      );

      // Ensure `getTransactions` was called once with the invalid query
      expect(transactionsService.getTransactions).toHaveBeenCalledWith({
        ...invalidQuery,
        chainId: 1, // Default chainId is applied
      });
    });

    it('should propagate BadRequestException from the service', async () => {
      const invalidQuery: TransactionsQueryDto = {
        startTime: 1620000000,
        endTime: 1610000000, // Invalid time range
        chainId: 1,
      };

      jest
        .spyOn(transactionsService, 'getTransactions')
        .mockRejectedValue(
          new BadRequestException(
            'Invalid time range: startTime cannot be greater than endTime',
          ),
        );

      await expect(controller.getTransactions(invalidQuery)).rejects.toThrow(
        BadRequestException,
      );

      // Ensure the service was called with the invalid query
      expect(transactionsService.getTransactions).toHaveBeenCalledWith(
        invalidQuery,
      );
    });

    it('should throw BadRequestException for invalid chainId', async () => {
      const query: TransactionsQueryDto = {
        startTime: 1610000000,
        endTime: 1620000000,
        chainId: 999, // Unsupported chainId
      };

      await expect(controller.getTransactions(query)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getTransactionByHash', () => {
    it('should return transaction details for a valid hash and chainId', async () => {
      jest
        .spyOn(transactionsService, 'getTransactionByHash')
        .mockResolvedValue(mockTransaction);

      const params: TransactionHashDto = {
        hash: '0x123abc456def789ghi123abc456def789ghi123abc456def789ghi123abc456d',
      };

      const query = { chainId: 1 }; // Ethereum Mainnet

      const result = await controller.getTransactionByHash(params, query);

      expect(result).toEqual(mockTransaction);
      expect(transactionsService.getTransactionByHash).toHaveBeenCalledWith(
        params.hash,
        query.chainId,
      );
    });

    it('should default chainId to 1 if not provided', async () => {
      jest
        .spyOn(transactionsService, 'getTransactionByHash')
        .mockResolvedValue(mockTransaction);

      const params: TransactionHashDto = {
        hash: '0x123abc456def789ghi123abc456def789ghi123abc456def789ghi123abc456d',
      };

      const query = {}; // No chainId provided

      const result = await controller.getTransactionByHash(params, query);

      expect(result).toEqual(mockTransaction);
      expect(transactionsService.getTransactionByHash).toHaveBeenCalledWith(
        params.hash,
        1, // Default chainId
      );
    });

    it('should throw NotFoundException for an invalid hash', async () => {
      jest
        .spyOn(transactionsService, 'getTransactionByHash')
        .mockRejectedValue(new NotFoundException('Transaction not found'));

      const params: TransactionHashDto = {
        hash: '0xinvalidhash456def789ghi123abc456def789ghi123abc456def789ghi123abc',
      };

      const query = { chainId: 1 }; // Ethereum Mainnet

      await expect(
        controller.getTransactionByHash(params, query),
      ).rejects.toThrow(NotFoundException);

      expect(transactionsService.getTransactionByHash).toHaveBeenCalledWith(
        params.hash,
        query.chainId,
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      jest
        .spyOn(transactionsService, 'getTransactionByHash')
        .mockRejectedValue(new Error('Unexpected error'));

      const params: TransactionHashDto = {
        hash: '0x123abc456def789ghi123abc456def789ghi123abc456def789ghi123abc456d',
      };

      const query = { chainId: 1 }; // Ethereum Mainnet

      await expect(
        controller.getTransactionByHash(params, query),
      ).rejects.toThrow(Error);

      expect(transactionsService.getTransactionByHash).toHaveBeenCalledWith(
        params.hash,
        query.chainId,
      );
    });
  });
});
