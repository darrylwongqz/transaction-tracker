import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SyncStatusResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Synchronization status as a human-readable string.',
    example: 'DB is 5 blocks behind',
  })
  status: string;

  @Expose()
  @ApiProperty({
    description: 'The latest block number available on the blockchain.',
    example: 18359771,
  })
  latestBlock: number;

  @Expose()
  @ApiProperty({
    description: 'The current synchronized block for the pool.',
    example: 18359766,
  })
  currentSyncBlock: number;

  @Expose()
  @ApiProperty({
    description: 'Chain Id - e.g. 1 for Ethereum Mainnet',
    example: 1,
  })
  chainId: number;

  @Expose()
  @ApiProperty({
    description: 'Pool address that sync status ran for',
    example: 1,
  })
  poolAddress: string;
}
