import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from './transactions-response.dto';

export class PaginatedTransactionsResponseDto {
  @ApiProperty({
    description: 'Total number of transactions matching the query',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Maximum number of transactions returned per page (limit)',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Number of transactions skipped for pagination (offset)',
    example: 0,
  })
  skip: number;

  @ApiProperty({
    description: 'Array of transaction entities returned for the current page',
    type: [TransactionResponseDto],
  })
  results: TransactionResponseDto[];
}
