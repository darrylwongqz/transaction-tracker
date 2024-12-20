import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { TransactionHashDto } from './dtos/request/transaction-hash.dto';
import { TransactionsQueryDto } from './dtos/request/transaction-query.dto';
import { PaginatedTransactionsResponseDto } from './dtos/response/paginated-transactions-response.dto';
import { TransactionResponseDto } from './dtos/response/transactions-response.dto';
import { SupportedChainQueryDto } from './dtos/request/supported-chain-query.dto';

@ApiTags('Transactions')
@UseInterceptors(CacheInterceptor)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({
    summary: 'Fetch all transactions within a specified time range',
    description: `
      Retrieves a paginated list of transactions based on the provided 
      query parameters, including start and end timestamps, pagination options 
      (limit and skip), and sorting criteria. This endpoint supports efficient 
      querying of historical transaction data.
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      'A paginated list of transactions matching the query criteria.',
    type: PaginatedTransactionsResponseDto,
  })
  @Get('/')
  async getTransactions(
    @Query() query: TransactionsQueryDto,
  ): Promise<PaginatedTransactionsResponseDto> {
    const chainId = query.chainId ?? 1; // Default chainId to 1 (Ethereum Mainnet)
    return this.transactionsService.getTransactions({ ...query, chainId });
  }

  @ApiOperation({
    summary: 'Retrieve details of a specific transaction by hash',
    description: `
      Fetches the details of a single transaction based on its unique hash.
      This is useful for inspecting individual transaction data, such as
      token transfers, fees, and block information.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'The details of the transaction identified by the hash.',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The transaction with the given hash was not found.',
  })
  @Get('/:hash')
  async getTransactionByHash(
    @Param() params: TransactionHashDto,
    @Query() query: SupportedChainQueryDto, // Use the new DTO for validation
  ): Promise<TransactionResponseDto> {
    const { hash } = params;
    const chainId = query.chainId ?? 1; // Default chainId to 1

    return this.transactionsService.getTransactionByHash(hash, chainId);
  }
}
