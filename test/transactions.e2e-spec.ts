import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { TransactionEntity } from '../src/transactions/entities/transaction.entity';
import { PoolEntity } from '../src/pools/entities/pools.entity';

import request from 'supertest';

describe('TransactionsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let transactionRepository: Repository<TransactionEntity>;
  let poolRepository: Repository<PoolEntity>;
  let pool: PoolEntity;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Explicitly clear cache and setup test-specific state if needed
    app.getHttpAdapter().getInstance().cacheStore?.reset();

    await app.init();

    dataSource = moduleFixture.get(DataSource);
    transactionRepository = dataSource.getRepository(TransactionEntity);
    poolRepository = dataSource.getRepository(PoolEntity);
  });

  beforeEach(async () => {
    // Disable foreign key checks for cleanup
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Clear tables
    await transactionRepository.clear();
    await poolRepository.clear();

    // Enable foreign key checks
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');

    // Insert a test pool
    pool = await poolRepository.save({
      address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
      chainId: 1,
      currentBlock: 21202122,
    });
  });

  afterEach(async () => {
    // Clear any application-level cache
    app.getHttpAdapter().getInstance().cacheStore?.reset();

    // Disable foreign key checks for cleanup
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Clear tables
    await transactionRepository.clear();
    await poolRepository.clear();

    // Enable foreign key checks
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1;');
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  it('should return transactions with default limit and skip', async () => {
    // Insert a mock transaction
    const transaction = await transactionRepository.save({
      hash: '0x125e0b641d4a4b08806bf52c0c6757648c9963bcda8681e4f996f09e00d4c2cc',
      blockNumber: 12345678,
      timestamp: Math.floor(Date.now() / 1000),
      pool, // Reference the pool
      chainId: pool.chainId,
      gasPrice: '5000000000',
      gasUsed: '21000',
      transactionFeeEth: '0.000105',
      transactionFee: '0.50',
    });

    const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const endTime = Math.floor(Date.now() / 1000);

    const response = await request(app.getHttpServer())
      .get(`/transactions?startTime=${startTime}&endTime=${endTime}`)
      .expect(200);

    // Assert the structure of the response
    expect(response.body).toMatchObject({
      total: 1,
      skip: 0,
      limit: 10,
      results: [
        {
          hash: transaction.hash,
          blockNumber: transaction.blockNumber,
          timestamp: transaction.timestamp,
          chainId: transaction.chainId,
          transactionFee: parseFloat(transaction.transactionFee).toFixed(18),
        },
      ],
    });
  });

  it('should throw BadRequestException if startTime or endTime is missing', async () => {
    await request(app.getHttpServer())
      .get('/transactions?startTime=')
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain(
          'startTime and endTime are required',
        );
      });
  });

  it('should throw NotFoundException if the transaction does not exist', async () => {
    await request(app.getHttpServer())
      .get('/transactions/0xnonexistent')
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toContain('Transaction not found');
      });
  });

  it('should return transaction details for a valid hash', async () => {
    // Insert a mock transaction
    const transaction = await transactionRepository.save({
      hash: '0xvalidhash',
      blockNumber: 21211233,
      timestamp: 1731892331,
      pool, // Reference the pool
      chainId: pool.chainId,
      gasPrice: '5000000000',
      gasUsed: '21000',
      transactionFeeEth: '0.000105',
      transactionFee: '24.033792114255470266',
    });

    const response = await request(app.getHttpServer())
      .get(`/transactions/${transaction.hash}`)
      .query({ chainId: pool.chainId }) // Add the chainId query parameter
      .expect(200);

    // Assert the response matches the expected format
    expect(response.body).toEqual({
      hash: transaction.hash,
      blockNumber: transaction.blockNumber,
      timestamp: transaction.timestamp,
      transactionFee: transaction.transactionFee,
      chainId: transaction.chainId,
    });
  });
});
