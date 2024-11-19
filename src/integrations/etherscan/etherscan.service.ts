import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TokenTransferEventsDto } from './dtos/request/token-transfer-events.dto';
import { TokenTransferEventsResponseDto } from './dtos/response/token-transfer-events-response.dto';

@Injectable()
export class EtherscanService {
  private BASE_URL = 'https://api.etherscan.io/api';
  private apiKey: string;
  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = configService.get('ETHERSCAN_API_KEY');
  }

  /**
   * Fetches token transfer events for a specified contract and address from the Etherscan API.
   *
   * This method queries the Etherscan API's `tokentx` endpoint to retrieve a list of token transfer
   * events for a specific contract address (e.g., USDC or WETH) and pool address, within a given block range.
   *
   * @param tokenTransferEventsDto - The DTO containing contract address, target address, and block range details.
   * @returns A promise resolving to a `TokenTransferEventsResponseDto` containing:
   *          - The total number of events
   *          - The list of events
   *          - Whether the response was trimmed due to Etherscan's 10,000-record limit
   * @throws InternalServerErrorException if the Etherscan API call fails.
   */
  async getTokenTransferEvents(
    tokenTransferEventsDto: TokenTransferEventsDto,
  ): Promise<TokenTransferEventsResponseDto> {
    try {
      const response = await this.httpService.axiosRef.get(this.BASE_URL, {
        params: {
          module: 'account',
          action: 'tokentx',
          contractaddress: tokenTransferEventsDto.contractAddress,
          address: tokenTransferEventsDto.address,
          page: 1,
          offset: 10000,
          startblock: tokenTransferEventsDto.startBlock,
          endblock: tokenTransferEventsDto.endBlock,
          sort: 'asc',
          apikey: this.apiKey,
        },
      });

      if (response.data.status === '1') {
        let events = response.data.result || []; // Changed to `let` for reassignment
        let isTrimmed = false;

        // Handle Etherscan's 10,000-record limit
        if (events.length === 10000) {
          const lastBlockNumber = events[events.length - 1].blockNumber;
          events = events.filter((txn) => txn.blockNumber !== lastBlockNumber); // Reassign `events`
          isTrimmed = true;
        }

        return { total: events.length, events, isTrimmed };
      }

      if (
        response.data.status === '0' &&
        response.data.message === 'No transactions found'
      ) {
        // Valid response with no transactions
        return { total: 0, events: [], isTrimmed: false };
      }

      throw new Error(
        `Etherscan API error: ${response.data.message || 'Unknown error'}`,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch token transfer events: ${error.message}`,
      );
    }
  }
  /**
   * Fetches the latest block number from the Etherscan API.
   *
   * This method queries the Etherscan API's `eth_blockNumber` endpoint to retrieve the latest
   * block number on the Ethereum network.
   *
   * @returns A promise resolving to the latest block number as a decimal number.
   * @throws InternalServerErrorException if the Etherscan API call fails or returns an error.
   */
  async getBlockNumber(): Promise<number> {
    try {
      const response = await this.httpService.axiosRef.get(this.BASE_URL, {
        params: {
          module: 'proxy',
          action: 'eth_blockNumber',
          apikey: this.apiKey,
        },
      });

      if (response.data.status !== '1' && !response.data.result) {
        throw new Error(
          `Etherscan API error: ${response.data.message || 'Unknown error'}`,
        );
      }

      // Convert the block number from hex to decimal
      const blockNumber = parseInt(response.data.result, 16);
      if (isNaN(blockNumber)) {
        throw new Error(
          `Invalid block number received: ${response.data.result}`,
        );
      }

      return blockNumber;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch the latest block number: ${error.message}`,
      );
    }
  }
}
