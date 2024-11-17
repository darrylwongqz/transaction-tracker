import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PaginatedTransactionsResponseDto } from './dtos/response/paginated-transactions-response.dto';
import { TransactionResponseDto } from './dtos/response/transactions-response.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: Repository<TransactionEntity>;

  const mockTransaction = {
    hash: '0x125e0b641d4a4b08806bf52c0c6757648c9963bcda8681e4f996f09e00d4c2cc',
    blockNumber: 12376729,
    timestamp: 1620250931,
    gasPrice: '64000000000',
    gasUsed: '5201405',
    transactionFeeEth: '0.1',
    transactionFee: '2.5',
    pool: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
    chainId: 1, // Ethereum Mainnet
  };

  const mockTransactionArray = [mockTransaction];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(TransactionEntity),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repository = module.get<Repository<TransactionEntity>>(
      getRepositoryToken(TransactionEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTransactions', () => {
    it('should return a paginated list of transactions with chainId', async () => {
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValueOnce([mockTransactionArray, 3]);

      const result = await service.getTransactions({
        startTime: 1610000000,
        endTime: 1620000000,
        limit: 2,
        skip: 0,
        chainId: 1, // Explicitly provide chainId
      });

      expect(result).toBeInstanceOf(PaginatedTransactionsResponseDto);
      expect(result).toMatchObject({
        total: 3,
        limit: 2,
        skip: 0,
        results: expect.arrayContaining([
          expect.objectContaining({
            hash: mockTransaction.hash,
          }),
        ]),
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {
          timestamp: Between(1610000000, 1620000000),
          chainId: 1, // Include chainId in the query
        },
        skip: 0,
        take: 2,
        order: { timestamp: 'ASC' },
      });
    });

    it('should default chainId to 1 if not provided', async () => {
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValueOnce([mockTransactionArray, 3]);

      await service.getTransactions({
        startTime: 1610000000,
        endTime: 1620000000,
        limit: 2,
        skip: 0,
      });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {
          timestamp: Between(1610000000, 1620000000),
          chainId: 1, // Default chainId
        },
        skip: 0,
        take: 2,
        order: { timestamp: 'ASC' },
      });
    });

    it('should enforce a maximum limit of 1000 with chainId', async () => {
      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValueOnce([mockTransactionArray, 3]);

      const result = await service.getTransactions({
        startTime: 1610000000,
        endTime: 1620000000,
        limit: 2000,
        skip: 0,
        chainId: 1,
      });

      expect(result.limit).toEqual(1000);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {
          timestamp: Between(1610000000, 1620000000),
          chainId: 1, // Include chainId
        },
        skip: 0,
        take: 1000,
        order: { timestamp: 'ASC' },
      });
    });

    it('should throw BadRequestException if startTime or endTime is missing', async () => {
      await expect(
        service.getTransactions({ startTime: null, endTime: 1620000000 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getTransactions({ startTime: 1610000000, endTime: null }),
      ).rejects.toThrow(BadRequestException);

      expect(repository.findAndCount).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if startTime is greater than endTime', async () => {
      await expect(
        service.getTransactions({ startTime: 1620000000, endTime: 1610000000 }),
      ).rejects.toThrow(BadRequestException);

      expect(repository.findAndCount).not.toHaveBeenCalled();
    });

    it('should skip records for pagination and return the correct record', async () => {
      const mockTransactions = [
        {
          ...mockTransaction,
          hash: '0x123abc456def789ghi123abc456def789ghi123abc456def789ghi123abc456d',
        },
        {
          ...mockTransaction,
          hash: '0x456def789abc123ghi456def789abc123ghi456def789abc123ghi456def789a',
        },
        {
          ...mockTransaction,
          hash: '0x789abc123def456ghi789abc123def456ghi789abc123def456ghi789abc123d',
        },
      ];

      jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValueOnce([[mockTransactions[1]], 3]);

      const result = await service.getTransactions({
        startTime: 1610000000,
        endTime: 1620000000,
        limit: 1,
        skip: 1,
        chainId: 1,
      });

      expect(result.skip).toEqual(1);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].hash).toEqual(
        '0x456def789abc123ghi456def789abc123ghi456def789abc123ghi456def789a',
      );

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {
          timestamp: Between(1610000000, 1620000000),
          chainId: 1,
        },
        skip: 1,
        take: 1,
        order: { timestamp: 'ASC' },
      });
    });

    it('should return an empty result set if no transactions are found', async () => {
      jest.spyOn(repository, 'findAndCount').mockResolvedValueOnce([[], 0]);

      const result = await service.getTransactions({
        startTime: 1610000000,
        endTime: 1620000000,
        limit: 10,
        skip: 0,
      });

      expect(result.total).toEqual(0);
      expect(result.results).toHaveLength(0);
    });

    it('should handle repository errors gracefully', async () => {
      jest.spyOn(repository, 'findAndCount').mockRejectedValueOnce(new Error());

      await expect(
        service.getTransactions({
          startTime: 1610000000,
          endTime: 1620000000,
        }),
      ).rejects.toThrow(Error);
    });
  });

  describe('getTransactionByHash', () => {
    it('should return a transaction when a valid hash and chainId are provided', async () => {
      const validTransaction = {
        ...mockTransaction,
        hash: '0x125e0b641d4a4b08806bf52c0c6757648c9963bcda8681e4f996f09e00d4c2cc',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(validTransaction);

      const result = await service.getTransactionByHash(
        '0x125e0b641d4a4b08806bf52c0c6757648c9963bcda8681e4f996f09e00d4c2cc',
        1,
      );

      expect(result).toBeInstanceOf(TransactionResponseDto);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          hash: '0x125e0b641d4a4b08806bf52c0c6757648c9963bcda8681e4f996f09e00d4c2cc',
          chainId: 1,
        }, // Include chainId
      });
    });

    it('should default chainId to 1 if not provided', async () => {
      const validTransaction = {
        ...mockTransaction,
        hash: '0x456def789abc123ghi456def789abc123ghi456def789abc123ghi456def789a',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(validTransaction);

      await service.getTransactionByHash(
        '0x456def789abc123ghi456def789abc123ghi456def789abc123ghi456def789a',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          hash: '0x456def789abc123ghi456def789abc123ghi456def789abc123ghi456def789a',
          chainId: 1, // Default chainId
        },
      });
    });

    it('should throw NotFoundException if transaction is not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);

      const invalidHash =
        '0x999abc456def789ghi123abc456def789ghi123abc456def789ghi123abc999d';

      await expect(
        service.getTransactionByHash(invalidHash, 1),
      ).rejects.toThrow(NotFoundException);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { hash: invalidHash, chainId: 1 },
      });
    });

    it('should handle database errors gracefully', async () => {
      // Simulate a database error
      jest
        .spyOn(repository, 'findOne')
        .mockRejectedValueOnce(new Error('Database error'));

      const validHash =
        '0x125e0b641d4a4b08806bf52c0c6757648c9963bcda8681e4f996f09e00d4c2cc';

      await expect(
        service.getTransactionByHash(validHash, 1), // Include chainId
      ).rejects.toThrow(Error);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { hash: validHash, chainId: 1 }, // Add chainId to query
      });
    });

    it('should exclude extraneous fields from the result', async () => {
      const transactionWithExtraFields = {
        ...mockTransaction,
        hash: '0x456def789abc123ghi456def789abc123ghi456def789abc123ghi456def789a',
        extraneousField: 'extra-data', // Simulate extra field in DB result
      };

      jest
        .spyOn(repository, 'findOne')
        .mockResolvedValueOnce(transactionWithExtraFields);

      const result = await service.getTransactionByHash(
        transactionWithExtraFields.hash,
        1, // Include chainId
      );

      expect(result).toBeInstanceOf(TransactionResponseDto);
      expect(result).toMatchObject({
        hash: transactionWithExtraFields.hash,
      });
      expect(result).not.toHaveProperty('extraneousField'); // Ensure extra fields are excluded

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          hash: transactionWithExtraFields.hash,
          chainId: 1,
        },
      });
    });
  });

  describe('bulkUpdateTransactions', () => {
    const mockedTransactions = [
      {
        hash: '0xabc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
        blockNumber: 12345,
      },
      {
        hash: '0xdef4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        timestamp: 1697421143,
      },
      {
        hash: '0xghi7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123',
        gasPrice: '50',
      },
    ];

    it('should save multiple transactions successfully', async () => {
      jest
        .spyOn(repository, 'save')
        .mockImplementation(async (entity) => entity as TransactionEntity);

      const result = await service.bulkUpdateTransactions(mockedTransactions);

      // Verify the result is `true`
      expect(result).toEqual(true);

      // Ensure `repository.save` is called for each transaction
      expect(repository.save).toHaveBeenCalledTimes(mockedTransactions.length);

      // Verify each transaction is passed correctly to `repository.save`
      mockedTransactions.forEach((transaction) => {
        expect(repository.save).toHaveBeenCalledWith(transaction);
      });
    });

    it('should handle an empty array of transactions', async () => {
      // Call the method with an empty array
      const result = await service.bulkUpdateTransactions([]);

      // Verify the result is `true`
      expect(result).toEqual(true);

      // Ensure `repository.save` is never called
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should handle partial transaction entities', async () => {
      const partialTransactions = [
        {
          hash: '0xpartial1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          blockNumber: 12345,
        },
        {
          hash: '0xpartial4567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
          timestamp: 1697421143,
        },
      ];

      jest
        .spyOn(repository, 'save')
        .mockImplementation(async (entity) => entity as TransactionEntity);

      const result = await service.bulkUpdateTransactions(partialTransactions);

      // Verify the result is `true`
      expect(result).toEqual(true);

      // Ensure `repository.save` is called for each partial transaction
      expect(repository.save).toHaveBeenCalledTimes(partialTransactions.length);
      partialTransactions.forEach((transaction) => {
        expect(repository.save).toHaveBeenCalledWith(transaction);
      });
    });

    it('should throw an error if `repository.save` fails for any transaction', async () => {
      jest.spyOn(repository, 'save').mockImplementation(async (entity) => {
        if (
          entity.hash ===
          '0xerror7890abcdef1234567890abcdef1234567890abcdef1234567890abc'
        ) {
          throw new Error('Database error');
        }
        return entity as TransactionEntity;
      });

      const transactionsWithError = [
        ...mockedTransactions,
        {
          hash: '0xerror7890abcdef1234567890abcdef1234567890abcdef1234567890abc',
          blockNumber: 99999,
        },
      ];

      // Ensure the service throws an error
      await expect(
        service.bulkUpdateTransactions(transactionsWithError),
      ).rejects.toThrow('Database error');

      // Ensure `repository.save` is called up to the failing transaction
      transactionsWithError.forEach((transaction) => {
        if (
          transaction.hash ===
          '0xerror7890abcdef1234567890abcdef1234567890abcdef1234567890abc'
        ) {
          expect(repository.save).toHaveBeenCalledWith(transaction);
        }
      });
    });

    it('should log a warning for duplicate transactions and skip duplicates', async () => {
      const duplicateTransactions = [
        {
          hash: '0xdup1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
          blockNumber: 12345,
        },
        {
          hash: '0xdup1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
          blockNumber: 12346,
        },
      ];

      jest
        .spyOn(repository, 'save')
        .mockImplementation(async (entity) => entity as TransactionEntity);

      const loggerSpy = jest.spyOn(Logger.prototype, 'warn');

      const result = await service.bulkUpdateTransactions(
        duplicateTransactions,
      );

      // Verify the result is `true`
      expect(result).toEqual(true);

      // Ensure `repository.save` is called only once for the unique transaction
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith(duplicateTransactions[0]);

      // Ensure a warning was logged for the duplicate
      expect(loggerSpy).toHaveBeenCalledWith(
        `Duplicate transaction hash detected: ${duplicateTransactions[1].hash}`,
      );
    });

    it('should log a warning and skip transactions without a hash', async () => {
      const transactionsWithMissingHash = [
        {
          blockNumber: 12345,
        },
        {
          hash: '0xvalidhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
          blockNumber: 12346,
        },
      ];

      jest
        .spyOn(repository, 'save')
        .mockImplementation(async (entity) => entity as TransactionEntity);

      const loggerSpy = jest.spyOn(Logger.prototype, 'warn');

      const result = await service.bulkUpdateTransactions(
        transactionsWithMissingHash,
      );

      // Verify the result is `true`
      expect(result).toEqual(true);

      // Ensure `repository.save` is called only for the transaction with a hash
      expect(repository.save).toHaveBeenCalledTimes(1);
      expect(repository.save).toHaveBeenCalledWith(
        transactionsWithMissingHash[1],
      );

      // Ensure a warning was logged for the missing hash
      expect(loggerSpy).toHaveBeenCalledWith(
        'Transaction without a hash encountered, skipping:',
        transactionsWithMissingHash[0],
      );
    });
  });
});
