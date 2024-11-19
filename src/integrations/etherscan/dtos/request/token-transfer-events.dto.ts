import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress } from '../../../../common/decorators/is-ethereum-address.decorator';

/**
 * TokenTransferEventsDto
 *
 * Data Transfer Object (DTO) for querying token transfer events from a blockchain.
 * This DTO validates the input parameters required for querying a token's transfer
 * events between specific block ranges.
 *
 * --- Features ---
 * - **Contract Address:** Ensures the provided token contract address is a valid Ethereum address.
 * - **Pool/Wallet Address:** Validates the pool or wallet address where transfers occurred.
 * - **Block Range:** Defines the range of blocks to query for events.
 *
 * --- Usage ---
 * This DTO is typically used in service methods or controllers to encapsulate and validate
 * the parameters for fetching token transfer events from APIs like Etherscan.
 *
 * --- Validation Rules ---
 * - `contractAddress` and `address` must be valid Ethereum addresses.
 * - `startBlock` and `endBlock` must be numeric and non-empty.
 *
 * --- Swagger Integration ---
 * Includes Swagger metadata for API documentation and validation.
 */
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
