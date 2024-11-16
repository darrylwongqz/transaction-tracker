import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TransactionResponseDto {
  @Expose()
  @ApiProperty({
    description:
      'Transaction hash, uniquely identifying this transaction on the blockchain.',
    example: '0x123abc456def789ghi...',
  })
  hash: string;

  @Expose()
  @ApiProperty({
    description: 'Block number in which the transaction was confirmed.',
    example: 12345678,
  })
  blockNumber: number;

  @Expose()
  @ApiProperty({
    description:
      'Timestamp when the transaction was confirmed, as a Unix timestamp.',
    example: 1697421143,
  })
  timestamp: number;

  @Expose()
  @ApiProperty({
    description: 'Transaction fee in USDT.',
    example: 22.28,
  })
  transactionFee: number;
}
