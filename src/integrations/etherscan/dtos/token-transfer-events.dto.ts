import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress } from '../../../common/decorators/is-ethereum-address.decorator';

export class TokenTransferEventsDto {
  @ApiProperty({
    description: 'The contract address of the token (e.g., USDC or WETH).',
    example: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  contractAddress: string;

  @ApiProperty({
    description: 'The pool or wallet address to query.',
    example: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'The starting block number for the query.',
    example: 12965000,
  })
  @IsNumber()
  @IsNotEmpty()
  startBlock: number;

  @ApiProperty({
    description: 'The ending block number for the query.',
    example: 12966000,
  })
  @IsNumber()
  @IsNotEmpty()
  endBlock: number;
}
