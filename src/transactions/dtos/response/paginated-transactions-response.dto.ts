import { ApiProperty } from '@nestjs/swagger';
import { TransactionResponseDto } from './transactions-response.dto';
import { Expose } from 'class-transformer';

export class PaginatedTransactionsResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Total number of transactions matching the query',
    example: 100,
  })
  total: number;

  @Expose()
  @ApiProperty({
    description: 'Maximum number of transactions returned per page (limit)',
    example: 10,
  })
  limit: number;

  @Expose()
  @ApiProperty({
    description: 'Number of transactions skipped for pagination (offset)',
    example: 0,
  })
  skip: number;

  @Expose()
  @ApiProperty({
    description: 'Array of transaction entities returned for the current page',
    type: [TransactionResponseDto],
  })
  results: TransactionResponseDto[];
}
