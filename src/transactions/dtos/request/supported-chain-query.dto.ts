import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsPositive } from 'class-validator';
import { IsSupportedChain } from '../../../common/decorators/is-supported-chain.decorator';

export class SupportedChainQueryDto {
  @ApiProperty({
    description: 'Blockchain chain ID. Defaults to 1 (Ethereum Mainnet).',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsSupportedChain({
    message:
      'chainId must be one of the supported chain IDs: 1 (Ethereum), (101 (Solana) - after implementation...)',
  })
  readonly chainId?: number;
}
