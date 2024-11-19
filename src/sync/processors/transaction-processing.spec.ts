import { Test, TestingModule } from '@nestjs/testing';
import { TransactionProcessingProcessor } from './transaction-processing.processor';
import { TransactionsService } from '../../transactions/transactions.service';
import { PoolsService } from '../../pools/pools.service';
import { EtherscanService } from '../../integrations/etherscan/etherscan.service';
import { PricingService } from '../../pricing/pricing.service';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TransactionProcessingDto } from '../dtos/request/transaction-processing.dto';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { USDC_WETH_POOL_INFO } from '../../pools/constants/pools.constants';
import { TRANSACTION_PROCESSING_QUEUE } from '../sync.constants';
import { EventEntity } from '../../integrations/etherscan/entities/event.entity';
import { TokenTransferEventsResponseDto } from '../../integrations/etherscan/dtos/response/token-transfer-events-response.dto';
import { BinanceKlineResponseDto } from '../../integrations/binance/dtos/response/binance-kline-response.dto';
import { PoolEntity } from '../../pools/entities/pools.entity';

describe('TransactionProcessingProcessor', () => {
  let processor: TransactionProcessingProcessor;
  let transactionsService: jest.Mocked<TransactionsService>;
  let poolsService: jest.Mocked<PoolsService>;
  let etherscanService: jest.Mocked<EtherscanService>;
  let pricingService: jest.Mocked<PricingService>;

  // Spies for Logger methods to suppress log output
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Suppress Logger output by mocking its methods to no-op
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    debugSpy = jest
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => {});

    // Create mocks for dependencies
    transactionsService = {
      bulkUpdateTransactions: jest.fn(),
    } as unknown as jest.Mocked<TransactionsService>;

    poolsService = {
      setCurrentBlock: jest.fn(),
    } as unknown as jest.Mocked<PoolsService>;

    etherscanService = {
      getTokenTransferEvents: jest.fn(),
    } as unknown as jest.Mocked<EtherscanService>;

    pricingService = {
      getKlineData: jest.fn(),
    } as unknown as jest.Mocked<PricingService>;

    // Initialize the testing module without providing Logger
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionProcessingProcessor,
        {
          provide: TransactionsService,
          useValue: transactionsService,
        },
        {
          provide: PoolsService,
          useValue: poolsService,
        },
        {
          provide: EtherscanService,
          useValue: etherscanService,
        },
        {
          provide: PricingService,
          useValue: pricingService,
        },
        // Logger is instantiated internally; no need to provide it
      ],
    }).compile();

    // Retrieve the processor instance
    processor = module.get<TransactionProcessingProcessor>(
      TransactionProcessingProcessor,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  /**
   * Test: Processor Definition
   *
   * Ensures that the TransactionProcessingProcessor is defined and properly instantiated.
   */
  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  /**
   * Describe: process
   *
   * Contains all tests related to the process method of TransactionProcessingProcessor.
   */
  describe('process', () => {
    /**
     * Helper function to create a mock Job.
     * @param overrides - Partial object to override default job data.
     * @returns A mock Job<TransactionProcessingDto>.
     */
    const createMockJob = (
      overrides?: Partial<TransactionProcessingDto>,
    ): Job<TransactionProcessingDto> =>
      ({
        id: 'job-id-123',
        name: TRANSACTION_PROCESSING_QUEUE, // Added 'name' property
        data: {
          poolAddress: USDC_WETH_POOL_INFO.address,
          chainId: USDC_WETH_POOL_INFO.chainId,
          startBlock: 1000,
          endBlock: 1100,
          chainType: USDC_WETH_POOL_INFO.chainType,
          contractAddress: USDC_WETH_POOL_INFO.token0,
          address: USDC_WETH_POOL_INFO.address, // Added required 'address' property
          ...overrides,
        },
        opts: {},
        queue: {} as any, // Mocked as any since it's not used
        progress: 0,
        isCompleted: jest.fn().mockResolvedValue(false),
        isFailed: jest.fn().mockResolvedValue(false),
        isActive: jest.fn().mockResolvedValue(false),
        isDelayed: jest.fn().mockResolvedValue(false),
        remove: jest.fn(),
        moveToCompleted: jest.fn(),
        moveToFailed: jest.fn(),
        updateProgress: jest.fn(),
        retry: jest.fn(),
        // Added other required properties with default or mock values
        stacktrace: null,
        returnvalue: null,
        finishedOn: null,
        processedOn: null,
        timestamp: Date.now(),
        attemptsMade: 0,
        failedReason: null,
        progressDetails: null,
        delay: 0,
        returnvalueChain: null,
        options: {},
      }) as unknown as Job<TransactionProcessingDto>;

    /**
     * Test: Successful Transaction Processing
     *
     * Verifies that when valid events and price data are present, transactions are mapped, saved, and the current block is updated correctly.
     */
    it('should process transactions successfully when valid events and prices are present', async () => {
      // Arrange
      const mockJob = createMockJob();

      const mockEvents: EventEntity[] = [
        {
          hash: '0xhash1',
          blockNumber: 1001, // Changed from string to number
          timeStamp: '1609459200', // Unix timestamp in seconds as string
          gasPrice: '20000000000',
          gasUsed: '21000',
          gas: '420000000000000',
          // other fields as necessary
        },
        {
          hash: '0xhash2',
          blockNumber: 1002, // Changed from string to number
          timeStamp: '1609459260',
          gasPrice: '25000000000',
          gasUsed: '22000',
          gas: '550000000000000',
        },
      ];

      const mockPrices: BinanceKlineResponseDto = {
        total: 1,
        klines: [
          {
            openTime: 1609459200000, // Unix timestamp in milliseconds
            open: '1000.0',
            high: '1010.0',
            low: '990.0',
            close: '1005.0',
            volume: '500.0',
            closeTime: 1609459500000,
            quoteAssetVolume: '500000.0',
            numberOfTrades: 100,
            takerBuyBaseVolume: '250.0', // Corrected property name
            takerBuyQuoteVolume: '250000.0', // Corrected property name
          },
        ],
      };

      const expectedTransactions: Partial<TransactionEntity>[] = [
        {
          hash: '0xhash1',
          blockNumber: 1001,
          timestamp: 1609459200,
          pool: USDC_WETH_POOL_INFO.address as unknown as PoolEntity,
          chainId: USDC_WETH_POOL_INFO.chainId,
          gasPrice: '20000000000',
          gasUsed: '21000',
          transactionFeeEth: '0.00042',
          transactionFee: '0.42', // Corrected
        },
        {
          hash: '0xhash2',
          blockNumber: 1002,
          timestamp: 1609459260,
          pool: USDC_WETH_POOL_INFO.address as unknown as PoolEntity,
          chainId: USDC_WETH_POOL_INFO.chainId,
          gasPrice: '25000000000',
          gasUsed: '22000',
          transactionFeeEth: '0.00055',
          transactionFee: '0.55', // Corrected
        },
      ];

      etherscanService.getTokenTransferEvents.mockResolvedValueOnce({
        events: mockEvents,
        isTrimmed: false,
        total: mockEvents.length,
      } as TokenTransferEventsResponseDto);

      pricingService.getKlineData.mockResolvedValueOnce(mockPrices);

      transactionsService.bulkUpdateTransactions.mockResolvedValueOnce(
        undefined,
      );

      poolsService.setCurrentBlock.mockResolvedValueOnce(undefined);

      // Act
      const result = await processor.process(mockJob);

      // Assert
      // Verify EtherscanService calls
      expect(etherscanService.getTokenTransferEvents).toHaveBeenCalledTimes(1);
      expect(etherscanService.getTokenTransferEvents).toHaveBeenCalledWith({
        contractAddress: USDC_WETH_POOL_INFO.token0,
        address: USDC_WETH_POOL_INFO.address,
        startBlock: 1000,
        endBlock: 1100,
      });

      // Verify PricingService calls
      expect(pricingService.getKlineData).toHaveBeenCalledTimes(1);
      expect(pricingService.getKlineData).toHaveBeenCalledWith(
        'binance', // Correct provider string
        {
          symbol: 'ETHUSDT',
          interval: '5m', // Correct interval string
          startTime: 1609459200000,
          endTime: 1609459500000,
          limit: 1000,
        },
      );

      // Verify TransactionsService calls
      expect(transactionsService.bulkUpdateTransactions).toHaveBeenCalledTimes(
        1,
      );
      expect(transactionsService.bulkUpdateTransactions).toHaveBeenCalledWith(
        expectedTransactions,
      );

      // Verify PoolsService calls
      expect(poolsService.setCurrentBlock).toHaveBeenCalledTimes(1);
      expect(poolsService.setCurrentBlock).toHaveBeenCalledWith(
        USDC_WETH_POOL_INFO.chainType,
        USDC_WETH_POOL_INFO.address,
        USDC_WETH_POOL_INFO.chainId,
        1100,
      );

      // Optionally, verify the result if the processor returns something
      // Since in your implementation, process() returns void, you might skip this
      // If it returns something, uncomment the following lines:
      // expect(result.status).toEqual(1);
      // expect(result.transactions).toHaveLength(2);
      // expect(result.transactions).toMatchObject(expectedTransactions);
    });

    /**
     * Test: No Events Found
     *
     * Ensures that when no token transfer events are found, the processor handles the scenario gracefully without attempting to save transactions.
     */
    it('should handle scenario when no events are found', async () => {
      // Arrange
      const mockJob = createMockJob();

      etherscanService.getTokenTransferEvents.mockResolvedValueOnce({
        events: [],
        isTrimmed: false,
        total: 0,
      } as TokenTransferEventsResponseDto);

      poolsService.setCurrentBlock.mockResolvedValueOnce(undefined);

      // Act
      await processor.process(mockJob);

      // Assert
      // Verify EtherscanService calls
      expect(etherscanService.getTokenTransferEvents).toHaveBeenCalledTimes(1);
      expect(etherscanService.getTokenTransferEvents).toHaveBeenCalledWith({
        contractAddress: USDC_WETH_POOL_INFO.token0,
        address: USDC_WETH_POOL_INFO.address,
        startBlock: 1000,
        endBlock: 1100,
      });

      // Verify PoolsService calls
      expect(poolsService.setCurrentBlock).toHaveBeenCalledTimes(1);
      expect(poolsService.setCurrentBlock).toHaveBeenCalledWith(
        USDC_WETH_POOL_INFO.chainType,
        USDC_WETH_POOL_INFO.address,
        USDC_WETH_POOL_INFO.chainId,
        1100,
      );

      // Ensure no price fetching or transaction saving
      expect(pricingService.getKlineData).not.toHaveBeenCalled();
      expect(transactionsService.bulkUpdateTransactions).not.toHaveBeenCalled();
    });

    /**
     * Test: Error During Fetching Events
     *
     * Verifies that errors encountered while fetching token transfer events are handled appropriately.
     */
    it('should handle errors during fetching token transfer events', async () => {
      // Arrange
      const mockJob = createMockJob();

      const mockError = new Error('Etherscan API failure');
      etherscanService.getTokenTransferEvents.mockRejectedValueOnce(mockError);

      // Act
      await processor.process(mockJob);

      // Assert
      // Verify EtherscanService calls
      expect(etherscanService.getTokenTransferEvents).toHaveBeenCalledTimes(1);
      expect(etherscanService.getTokenTransferEvents).toHaveBeenCalledWith({
        contractAddress: USDC_WETH_POOL_INFO.token0,
        address: USDC_WETH_POOL_INFO.address,
        startBlock: 1000,
        endBlock: 1100,
      });

      // Ensure no price fetching or transaction saving
      expect(pricingService.getKlineData).not.toHaveBeenCalled();
      expect(transactionsService.bulkUpdateTransactions).not.toHaveBeenCalled();
      expect(poolsService.setCurrentBlock).not.toHaveBeenCalled();

      // Ensure error was logged
      expect(errorSpy).toHaveBeenCalledWith(
        `Error while processing transactions for pool ${USDC_WETH_POOL_INFO.address}: ${mockError.message}`,
        mockError.stack,
      );
    });
  });
});
