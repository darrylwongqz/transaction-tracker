import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionsQueryDto } from './dtos/request/transaction-query.dto';
import { TransactionHashDto } from './dtos/request/transaction-hash.dto';
import { PaginatedTransactionsResponseDto } from './dtos/response/paginated-transactions-response.dto';
import { TransactionResponseDto } from './dtos/response/transactions-response.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let transactionsService: TransactionsService;

  const mockTransactionsService = {
    getTransactions: jest.fn(),
    getTransactionByHash: jest.fn(),
  };

  const mockTransaction = {
    hash: '0x123abc456def789ghi123abc456def789ghi123abc456def789ghi123abc456def',
    blockNumber: 12345678,
    timestamp: 1620250931,
    transactionFee: 1139.6453122208,
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
      };

      const result = await controller.getTransactions(query);

      expect(result).toEqual(mockPaginatedResponse);
      expect(transactionsService.getTransactions).toHaveBeenCalledWith(query);
      expect(transactionsService.getTransactions).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid query params', async () => {
      jest
        .spyOn(transactionsService, 'getTransactions')
        .mockRejectedValue(new BadRequestException('Invalid query parameters'));

      const query: TransactionsQueryDto = {
        startTime: null,
        endTime: null,
        limit: 10,
        skip: 0,
      };

      await expect(controller.getTransactions(query)).rejects.toThrow(
        BadRequestException,
      );

      expect(transactionsService.getTransactions).toHaveBeenCalledWith(query);
    });

    it('should pass default pagination values when limit and skip are not provided', async () => {
      const query: TransactionsQueryDto = {
        startTime: 1610000000,
        endTime: 1620000000,
      };

      jest
        .spyOn(transactionsService, 'getTransactions')
        .mockResolvedValue(mockPaginatedResponse);

      const result = await controller.getTransactions(query);

      expect(transactionsService.getTransactions).toHaveBeenCalledWith({
        ...query,
        limit: 10,
        skip: 0,
      });
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should propagate BadRequestException from the service', async () => {
      const query: TransactionsQueryDto = {
        startTime: 1620000000,
        endTime: 1610000000, // Invalid range
      };

      jest
        .spyOn(transactionsService, 'getTransactions')
        .mockRejectedValue(new BadRequestException('startTime > endTime'));

      await expect(controller.getTransactions(query)).rejects.toThrow(
        BadRequestException,
      );

      expect(transactionsService.getTransactions).toHaveBeenCalledWith(query);
    });
  });

  describe('getTransactionByHash', () => {
    it('should return transaction details for a valid hash', async () => {
      jest
        .spyOn(transactionsService, 'getTransactionByHash')
        .mockResolvedValue(mockTransaction);

      const params: TransactionHashDto = {
        hash: mockTransaction.hash,
      };

      const result = await controller.getTransactionByHash(params);

      expect(result).toEqual(mockTransaction);
      expect(transactionsService.getTransactionByHash).toHaveBeenCalledWith(
        params.hash,
      );
      expect(transactionsService.getTransactionByHash).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException for an invalid hash', async () => {
      jest
        .spyOn(transactionsService, 'getTransactionByHash')
        .mockRejectedValue(new NotFoundException('Transaction not found'));

      const params: TransactionHashDto = {
        hash: '0xinvalidhash456def789ghi123abc456def789ghi123abc456def789ghi123abc',
      };

      await expect(controller.getTransactionByHash(params)).rejects.toThrow(
        NotFoundException,
      );

      expect(transactionsService.getTransactionByHash).toHaveBeenCalledWith(
        params.hash,
      );
    });

    it('should handle unexpected errors gracefully', async () => {
      jest
        .spyOn(transactionsService, 'getTransactionByHash')
        .mockRejectedValue(new Error('Unexpected error'));

      const params: TransactionHashDto = {
        hash: mockTransaction.hash,
      };

      await expect(controller.getTransactionByHash(params)).rejects.toThrow(
        Error,
      );

      expect(transactionsService.getTransactionByHash).toHaveBeenCalledWith(
        params.hash,
      );
    });

    it('should ensure hash is passed correctly to the service', async () => {
      const params: TransactionHashDto = {
        hash: '0x123abc456def789ghi123abc456def789ghi123abc456def789ghi123abc',
      };

      jest
        .spyOn(transactionsService, 'getTransactionByHash')
        .mockResolvedValue(mockTransaction);

      await controller.getTransactionByHash(params);

      expect(transactionsService.getTransactionByHash).toHaveBeenCalledWith(
        params.hash,
      );
    });
  });
});
