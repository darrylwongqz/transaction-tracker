import { IsNotEmpty } from 'class-validator';
import { IsSolanaAddress } from '../../../common/decorators/is-solana-address.decorator';

export class ValidateSolanaAddressDto {
  @IsSolanaAddress({ message: 'Invalid Solana address format' })
  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  chainId: number; // Ensure the correct chain ID is provided for Solana
}

export type SolanaAddress = string; // For Solana, addresses are case-sensitive strings.
