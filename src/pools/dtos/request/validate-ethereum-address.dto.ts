import { IsNotEmpty, IsInt } from 'class-validator';
import { IsEthereumAddress } from '../../../common/decorators/is-ethereum-address.decorator';

export class ValidateEthereumAddressDto {
  @IsEthereumAddress({ message: 'Invalid Ethereum address format' })
  @IsNotEmpty()
  address: string;

  @IsInt({ message: 'Chain ID must be an integer' })
  @IsNotEmpty()
  chainId: number;
}

export type EthereumAddress = string; // For Ethereum, addresses are strings (case-insensitive).
