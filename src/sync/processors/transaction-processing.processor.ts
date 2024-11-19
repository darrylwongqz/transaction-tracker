/**
 * 🛠️ **TransactionProcessingProcessor**
 *
 * This processor handles the processing of transactions within specified block ranges for a given liquidity pool.
 *
 * **Architecture Highlights:**
 * - **Modular Design:** The processing logic is broken down into smaller, focused methods for enhanced readability and testability.
 * - **Separation of Concerns:** Each method is responsible for a single aspect of the transaction processing workflow.
 * - **Error Handling:** Robust error handling ensures that issues are logged and do not disrupt the processing of other pools.
 */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { TransactionsService } from '../../transactions/transactions.service';
import { PoolsService } from '../../pools/pools.service';
import { EtherscanService } from '../../integrations/etherscan/etherscan.service';
import { PricingService } from '../../pricing/pricing.service';
import { differenceInMinutes, roundToNearestMinutes } from 'date-fns';
import BigNumber from 'bignumber.js';
import { pow10 } from '../../common/utils';
import { TransactionProcessingDto } from '../dtos/request/transaction-processing.dto';
import { BinanceKlineInterval } from '../../integrations/binance/dtos/request/binance-kline-param.dto';
import { TRANSACTION_PROCESSING_QUEUE } from '../sync.constants';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { ChainType } from '../../pools/constants/pools.enums';
import { PROVIDERS } from '../../pricing/constants/provider.constants';
import { PoolEntity } from '../../pools/entities/pools.entity';

@Processor(TRANSACTION_PROCESSING_QUEUE, {
  limiter: { max: 1, duration: 1000 }, // max 1 request per 1000 ms
})
export class TransactionProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(TransactionProcessingProcessor.name);

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly poolsService: PoolsService,
    private readonly pricingService: PricingService,
    private readonly etherscanService: EtherscanService,
  ) {
    super();
  }

  /**
   * Main process method invoked by BullMQ.
   * It orchestrates the transaction processing workflow for each job.
   * @param job - The job containing transaction processing data.
   */
  async process(job: Job<TransactionProcessingDto>) {
    const {
      poolAddress,
      chainId,
      startBlock,
      endBlock,
      chainType,
      contractAddress,
    } = job.data;

    // Step 1: Log the job payload
    this.logJobPayload(job);

    this.logger.log(
      `Processing transactions for pool: ${poolAddress} from block ${startBlock} to ${endBlock}`,
    );

    try {
      // Step 2: Fetch token transfer events from Etherscan
      const { events, isTrimmed } =
        await this.etherscanService.getTokenTransferEvents({
          contractAddress,
          address: poolAddress,
          startBlock,
          endBlock,
        });
      // Step 3: Handle scenario with no events
      if (events.length === 0) {
        await this.handleNoEvents(poolAddress, chainType, chainId, endBlock);
        return;
      }

      this.logger.log(`Fetched ${events.length} events for processing.`);

      // Step 4: Calculate and round time range
      const { startTime, endTime } = this.calculateRoundedTimeRange(events);

      // Step 5: Fetch price data
      const prices = await this.fetchPriceData(startTime, endTime);

      if (!prices || prices.length === 0) {
        this.logger.error('Price data is empty or invalid.');
        return;
      }
      this.logger.log(`Fetched ${prices.length} price points for processing.`);

      // Step 6: Map events to transactions
      const transactions = this.mapEventsToTransactions(
        events,
        prices,
        poolAddress,
        chainId,
      );

      // Step 7: Save transactions to the database
      await this.saveTransactions(transactions);
      this.logger.log(`Successfully saved transactions to the database.`);

      // Step 8: Determine last processed block
      const lastBlock = isTrimmed
        ? Number(events[events.length - 1].blockNumber)
        : endBlock;

      // Step 9: Update the current block number for the pool
      await this.updateCurrentBlock(poolAddress, chainType, chainId, lastBlock);
      this.logger.log(
        `Successfully processed transactions for pool: ${poolAddress}`,
      );
    } catch (error) {
      // Step 10: Handle any errors that occur during processing
      this.handleError(poolAddress, error);
    }
  }

  /**
   * Logs the received job payload.
   * @param job - The job containing transaction processing data.
   */
  private logJobPayload(job: Job<TransactionProcessingDto>): void {
    this.logger.debug(
      `Payload received to process >>> ${JSON.stringify(job.data)}`,
    );
  }

  /**
   * Handles scenarios where no token transfer events are found for the pool.
   * Logs a warning and updates the current block number to prevent redundant processing.
   * @param poolAddress - The address of the liquidity pool.
   * @param chainType - The type of blockchain (e.g., Ethereum).
   * @param chainId - The ID of the blockchain.
   * @param endBlock - The latest block number.
   */
  private async handleNoEvents(
    poolAddress: string,
    chainType: ChainType,
    chainId: number,
    endBlock: number,
  ): Promise<void> {
    this.logger.warn(`No transactions found for pool: ${poolAddress}`);
    await this.poolsService.setCurrentBlock(
      chainType,
      poolAddress,
      chainId,
      endBlock,
    );
  }

  /**
   * Calculates and rounds the start and end times based on event timestamps.
   * Rounds to the nearest 5 minutes for accurate price fetching.
   * @param events - The token transfer events.
   * @returns An object containing the rounded start and end times in milliseconds.
   */
  private calculateRoundedTimeRange(events: any[]): {
    startTime: number;
    endTime: number;
  } {
    const startTimeMillis = parseInt(events[0].timeStamp) * 1000;
    const endTimeMillis = parseInt(events[events.length - 1].timeStamp) * 1000;

    const startTime = roundToNearestMinutes(new Date(startTimeMillis), {
      nearestTo: 5,
      roundingMethod: 'floor',
    });
    const endTime = roundToNearestMinutes(new Date(endTimeMillis), {
      nearestTo: 5,
      roundingMethod: 'ceil',
    });

    this.logger.log(
      `Fetching price data for expanded time range: ${startTime.getTime()} - ${endTime.getTime()}`,
    );

    return { startTime: startTime.getTime(), endTime: endTime.getTime() };
  }

  /**
   * Fetches price data from the pricing service within the specified time range.
   * Handles pagination by fetching data in chunks - max 1000 lines per request, i.e. if 1500 lines are needed, it will fetch 1000 lines first,
   * then fetches the remaining 500 lines next
   * @param startTime - Start time in milliseconds.
   * @param endTime - End time in milliseconds.
   * @returns An array of processed price data points.
   */
  private async fetchPriceData(
    startTime: number,
    endTime: number,
  ): Promise<any[]> {
    const PRICE_INTERVAL = 5; // Fetches price data at 5-minute intervals
    const LIMIT = 1000; // BINANCE kline limit
    const MILLISECONDS = PRICE_INTERVAL * (LIMIT - 1) * 60 * 1000; // Converts the maximum time span (interval × number of points) that can be covered in a single API call to milliseconds.

    const results = [];
    let _startTime = startTime;

    while (_startTime < endTime) {
      try {
        this.logger.debug(
          `Fetching Kline data for range: ${_startTime} - ${Math.min(
            _startTime + MILLISECONDS,
            endTime,
          )}`,
        );
        const { klines } = await this.pricingService.getKlineData(
          PROVIDERS.BINANCE,
          {
            symbol: 'ETHUSDT',
            interval: BinanceKlineInterval.MIN_5,
            startTime: _startTime,
            endTime: Math.min(_startTime + MILLISECONDS, endTime),
            limit: LIMIT,
          },
        );

        this.logger.debug(`Fetched Kline data: ${JSON.stringify(klines)}`);

        results.push(...klines);
        _startTime += MILLISECONDS;
      } catch (error) {
        this.logger.error(
          `Error fetching Kline data for range: ${_startTime} - ${Math.min(
            _startTime + MILLISECONDS,
            endTime,
          )}: ${error.message}`,
          error.stack,
        );
        break; // Exit the loop on error to prevent infinite retries
      }
    }

    if (!results.length) {
      this.logger.error('No Kline data found.');
    }

    this.logger.debug(`Fetched ${results.length} Kline data points.`);
    return results
      .map((kline) => {
        const timestamp = kline.openTime; // openTime is already in milliseconds
        const price = parseFloat(kline.open);
        if (isNaN(timestamp) || isNaN(price)) {
          this.logger.warn(`Invalid Kline data: ${JSON.stringify(kline)}`);
          return null;
        }
        return { timestamp, price };
      })
      .filter((priceData) => priceData !== null);
  }

  /**
   * Finds the closest price data point to the given event timestamp.
   * @param eventTimestamp - The timestamp of the event in milliseconds.
   * @param prices - The array of price data points.
   * @returns The closest price data point.
   */
  private findClosestPrice(eventTimestamp: number, prices: any[]): any {
    return prices.reduce((closest, current) => {
      const closestDiff = Math.abs(closest.timestamp - eventTimestamp);
      const currentDiff = Math.abs(current.timestamp - eventTimestamp);
      return currentDiff < closestDiff ? current : closest;
    });
  }

  /**
   * Maps token transfer events to transaction entities by associating each event with the closest price data point.
   * It calculates transaction fees in both ETH and USDT.
   * @param events - The token transfer events.
   * @param prices - The price data points.
   * @param poolAddress - The address of the liquidity pool.
   * @param chainId - The ID of the blockchain.
   * @returns An array of transaction entities ready for database insertion.
   */
  private mapEventsToTransactions(
    events: any[],
    prices: any[],
    poolAddress: string,
    chainId: number,
  ): Partial<TransactionEntity>[] {
    this.logger.debug('Mapping events to transactions...');
    return events
      .map((event) => {
        const eventTimestamp = parseInt(event.timeStamp) * 1000;

        if (!prices || prices.length === 0) {
          this.logger.warn('No price data available for mapping.');
          return null;
        }

        // Find the closest price data point to the event timestamp
        const closestPrice = this.findClosestPrice(eventTimestamp, prices);

        // Calculate the time difference in minutes
        const timeDiff = differenceInMinutes(
          new Date(eventTimestamp),
          new Date(closestPrice.timestamp),
        );

        // Skip transactions where the price data is too far from the event timestamp
        if (Math.abs(timeDiff) >= 5) {
          this.logger.warn(
            `Timestamp difference too large: Event Timestamp ${eventTimestamp}, Price Timestamp ${closestPrice.timestamp}`,
          );
          return null; // Skip this transaction
        }

        this.logger.debug(
          `Event timestamp: ${eventTimestamp}, Closest price timestamp: ${closestPrice.timestamp}`,
        );

        // Calculate transaction fees
        const ethPriceUsdt = closestPrice.price;
        const gasPriceBN = new BigNumber(event.gasPrice).div(pow10(18)); // Convert gasPrice to ETH
        const gasUsed = parseInt(event.gasUsed);
        const transactionFeeEthBN = gasPriceBN.multipliedBy(gasUsed);
        const transactionFeeUsdtBN =
          transactionFeeEthBN.multipliedBy(ethPriceUsdt);

        return {
          hash: event.hash,
          blockNumber: event.blockNumber,
          timestamp: eventTimestamp / 1000, // Store as seconds
          pool: poolAddress as unknown as PoolEntity,
          chainId,
          gasPrice: event.gasPrice,
          gasUsed: event.gasUsed,
          transactionFeeEth: transactionFeeEthBN.toString(),
          transactionFee: transactionFeeUsdtBN.toString(),
        };
      })
      .filter((txn) => txn !== null);
  }

  /**
   * Saves mapped transactions to the database using the TransactionsService.
   * @param transactions - The array of transactions to save.
   */
  private async saveTransactions(
    transactions: Partial<TransactionEntity>[],
  ): Promise<void> {
    if (!transactions.length) {
      this.logger.warn('No valid transactions to save.');
      return;
    }
    this.logger.log(`Mapped ${transactions.length} transactions for saving.`);
    await this.transactionsService.bulkUpdateTransactions(transactions);
    this.logger.log(`Successfully saved transactions to the database.`);
  }

  /**
   * Updates the current block number for the pool in the database.
   * @param poolAddress - The address of the liquidity pool.
   * @param chainType - The type of blockchain (e.g., Ethereum).
   * @param chainId - The ID of the blockchain.
   * @param lastBlock - The latest block number processed.
   */
  private async updateCurrentBlock(
    poolAddress: string,
    chainType: ChainType,
    chainId: number,
    lastBlock: number,
  ): Promise<void> {
    this.logger.debug(
      `Updating current block for pool ${poolAddress} to block ${lastBlock}`,
    );
    await this.poolsService.setCurrentBlock(
      chainType,
      poolAddress,
      chainId,
      lastBlock,
    );
  }

  /**
   * Handles errors encountered during transaction processing.
   * Logs the error with relevant pool information.
   * @param poolAddress - The address of the liquidity pool.
   * @param error - The error encountered.
   */
  private handleError(poolAddress: string, error: Error): void {
    this.logger.error(
      `Error while processing transactions for pool ${poolAddress}: ${error.message}`,
      error.stack,
    );
  }
}
