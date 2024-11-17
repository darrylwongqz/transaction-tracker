import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * TransactionEntity represents a blockchain transaction.
 * This implementation is currently optimized for Ethereum-based networks.
 *
 * Future extensibility for other blockchains (e.g., Solana):
 * - Add fields specific to the chain, such as `nativeFee` for Solana.
 * - Consider creating a `chain_specific_data` JSON field for highly dynamic or chain-specific data.
 * - Update the services to calculate fees and handle gas/fee differences across chains.
 * - Possible to also consider splitting the transactions to transactions_eth, transactions_sol etc.
 */
@Entity('transactions')
@Index('idx_timestamp', ['timestamp'])
@Index('idx_pool_chain', ['pool', 'chainId']) // New composite index for pool and chainId
export class TransactionEntity {
  @ApiProperty({
    description: 'Unique transaction hash, serving as the primary key.',
    example: '0x123abc456def789ghi...',
  })
  @PrimaryColumn({ name: 'hash' })
  hash: string;

  @ApiProperty({
    description: 'Block number in which the transaction was included.',
    example: 18359771,
  })
  @Column({ name: 'block_number' })
  blockNumber: number;

  @ApiProperty({
    description: 'Unix timestamp when the transaction was confirmed.',
    example: 1697421143,
  })
  @Column({ name: 'timestamp' })
  timestamp: number;

  @ApiProperty({
    description:
      'The address of the Uniswap pool associated with this transaction.',
    example: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  })
  @Column({ name: 'pool' })
  pool: string;

  @ApiProperty({
    description: 'Chain ID where the transaction occurred.',
    example: 1, // Ethereum Mainnet
  })
  @Column({ name: 'chain_id' }) // New chainId column
  chainId: number;

  @ApiProperty({
    description: 'Gas price used for the transaction (in Gwei).',
    example: '50',
  })
  @Column({ name: 'gas_price' })
  gasPrice: string;

  @ApiProperty({
    description: 'Gas units consumed by the transaction.',
    example: '21000',
  })
  @Column({ name: 'gas_used' })
  gasUsed: string;

  @ApiProperty({
    description: 'Transaction fee in ETH (calculated as gasUsed * gasPrice).',
    example: '0.007411004855834384',
  })
  @Column('decimal', { name: 'transaction_fee_eth', precision: 38, scale: 18 })
  transactionFeeEth: string;

  @ApiProperty({
    description:
      'Transaction fee in USDT (calculated using ETH/USDT price at the time).',
    example: '22.28',
  })
  @Column('decimal', { name: 'transaction_fee', precision: 38, scale: 18 })
  transactionFee: string;
}
