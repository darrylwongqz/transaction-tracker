import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * SyncStatusQueryDto
 *
 * DTO for validating query parameters in the sync status endpoint.
 * If no address is provided, defaults to '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640'.
 */
export class SyncStatusQueryDto {
  @ApiProperty({
    description: 'The address of the pool for which sync status is queried.',
    example: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
    default: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
  })
  @IsEthereumAddress({ message: 'Invalid Ethereum address format' })
  @Transform(
    ({ value }) => value || '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
  )
  address: string;
}
