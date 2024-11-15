import { ApiProperty } from '@nestjs/swagger';

export class EventEntity {
  @ApiProperty({
    description: 'The block number in which the transaction occurred.',
    example: 12965000,
  })
  blockNumber: number;

  @ApiProperty({
    description: 'The timestamp of the transaction.',
    example: '1627921623',
  })
  timeStamp: string;

  @ApiProperty({
    description: 'The unique transaction hash.',
    example: '0x123...',
  })
  hash: string;

  @ApiProperty({
    description: 'The gas limit for the transaction.',
    example: '21000',
  })
  gas: string;

  @ApiProperty({ description: 'The gas price in Wei.', example: '5000000000' })
  gasPrice: string;

  @ApiProperty({
    description: 'The gas used for the transaction.',
    example: '21000',
  })
  gasUsed: string;
}
