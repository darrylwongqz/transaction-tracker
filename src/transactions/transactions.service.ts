import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { plainToInstance } from 'class-transformer';
import { PaginatedTransactionsResponseDto } from './dtos/response/paginated-transactions-response.dto';
import { TransactionsQueryDto } from './dtos/request/transaction-query.dto';
import { TransactionResponseDto } from './dtos/response/transactions-response.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
  ) {}

  /**
   * Fetches a paginated list of transactions within a specified time range.
   *
   * This method retrieves transactions based on the start and end timestamps provided in the query.
   * It also supports pagination via `limit` and `skip` parameters, with a maximum limit of 1000.
   *
   * @param query - Object containing `startTime`, `endTime`, `limit`, and `skip`.
   * @returns A promise that resolves to a `PaginatedTransactionsResponseDto` containing:
   *          - The total number of matching transactions
   *          - The limit and skip values used for pagination
   *          - An array of `TransactionResponseDto` for the current page
   * @throws BadRequestException if `startTime` or `endTime` is missing.
   */
  async getTransactions(
    query: TransactionsQueryDto,
  ): Promise<PaginatedTransactionsResponseDto> {
    const { startTime, endTime, limit = 10, skip = 0, chainId = 1 } = query;

    if (!startTime || !endTime) {
      throw new BadRequestException('startTime and endTime are required');
    }

    if (startTime > endTime) {
      throw new BadRequestException('startTime cannot be greater than endTime');
    }

    const cappedLimit = Math.min(limit, 1000);
    const [results, total] = await this.transactionRepository.findAndCount({
      where: {
        timestamp: Between(startTime, endTime),
        chainId,
      },
      skip,
      take: cappedLimit,
      order: { timestamp: 'ASC' },
    });

    const transformedResults = results.map((transaction) =>
      plainToInstance(TransactionResponseDto, transaction, {
        excludeExtraneousValues: true,
      }),
    );

    return plainToInstance(PaginatedTransactionsResponseDto, {
      total,
      limit: cappedLimit,
      skip,
      results: transformedResults,
    });
  }

  /**
   * Retrieves a single transaction by its hash.
   *
   * @param hash - The unique hash identifying the transaction.
   * @returns A promise that resolves to a `TransactionResponseDto` containing transaction details.
   * @throws NotFoundException if the transaction with the specified hash is not found.
   */
  async getTransactionByHash(
    hash: string,
    chainId: number = 1,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { hash, chainId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Transform the transaction entity into a response DTO
    return plainToInstance(TransactionResponseDto, transaction, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Updates or inserts a batch of transactions in the database.
   *
   * This method performs an upsert operation for each transaction in the provided array,
   * updating existing records or inserting new ones based on the transaction's hash.
   *
   * ## Deduplication:
   * - Deduplication is handled within this method to avoid processing the same transaction multiple times.
   * - Potential sources of duplicates include:
   *   1. **Overlapping Block Ranges**: Upstream processes might fetch overlapping block ranges from APIs, leading to repeated transactions.
   *   2. **Multiple Events for a Single Transaction**: A transaction triggering multiple smart contract events can result in duplicate entries sharing the same hash.
   *   3. **Concurrent or Parallel Processing**: Overlaps between workers processing the same range or pool can introduce duplicates.
   *   4. **Retry Logic**: Retried operations without idempotency guarantees may reprocess the same transactions.
   *   5. **Third-Party API Issues**: Inconsistent or redundant data returned by third-party APIs may lead to duplicates.
   *
   * ## How Deduplication is Implemented:
   * - A `seenHashes` Set is used to track hashes that have already been processed in the current batch.
   * - If a hash is already present in `seenHashes`, the transaction is skipped, and a warning is logged.
   * - This ensures that each hash is processed only once, avoiding unnecessary database operations and maintaining data integrity.
   *
   * @param transactions - Array of `Partial<TransactionEntity>` representing transactions to upsert.
   * @returns A promise that resolves to `true` when all transactions are processed.
   */
  async bulkUpdateTransactions(
    transactions: Partial<TransactionEntity>[],
  ): Promise<boolean> {
    const seenHashes = new Set<string>();
    const bulkOperations: Promise<TransactionEntity>[] = [];

    for (const transaction of transactions) {
      if (transaction.hash) {
        if (seenHashes.has(transaction.hash)) {
          this.logger.warn(
            `Duplicate transaction hash detected: ${transaction.hash}`,
          );
          continue; // Skip duplicate
        }
        seenHashes.add(transaction.hash);
        bulkOperations.push(this.transactionRepository.save(transaction));
      } else {
        this.logger.warn('Transaction without a hash encountered, skipping.');
      }
    }

    await Promise.all(bulkOperations);
    return true;
  }
}
