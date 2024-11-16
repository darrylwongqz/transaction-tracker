import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { IsEthereumHash } from '../../../common/decorators/is-ethereum-hash.decorator';

export class TransactionHashDto {
  @ApiProperty({
    description: 'Ethereum transaction hash',
    example: '0x123abc...',
  })
  @IsNotEmpty()
  @IsEthereumHash()
  hash: string;
}
