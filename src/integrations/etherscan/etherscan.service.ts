import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TokenTransferEventsDto } from './dtos/token-transfer-events.dto';
import { TokenTransferEventsResponseEntity } from './entities/token-transfer-events-response.entity';
import { firstValueFrom } from 'rxjs';

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
   * @returns A promise resolving to a `TokenTransferEventsResponseEntity` containing:
   *          - The total number of events
   *          - The list of events
   *          - Whether the response was trimmed due to Etherscan's 10,000-record limit
   * @throws Will throw an error if the Etherscan API call fails.
   */
  async getTokenTransferEvents(
    tokenTransferEventsDto: TokenTransferEventsDto,
  ): Promise<TokenTransferEventsResponseEntity> {
    const response = await firstValueFrom(
      this.httpService.get(this.BASE_URL, {
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
      }),
    );

    let events = response.data.result;
    let isTrimmed = false;

    // note that most of the accounts endpoints in etherscan returns a maximum of 10,000 records
    // https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-erc20-token-transfer-events-by-address
    if (events.length === 10000) {
      const _lastBlock = events[events.length - 1];
      events = events.filter(
        (txn) => txn.blockNumber != _lastBlock.blockNumber,
      );
      isTrimmed = true;
    }

    return { total: events.length, events, isTrimmed };
  }
}
