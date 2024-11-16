import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pools')
@Index('idx_address', ['address'])
@Index('uq_pools_address_chain', ['address', 'chainId'], { unique: true })
export class PoolEntity {
  @ApiProperty({
    description: 'Unique identifier for the pool (auto-incremented).',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The address of the pool (stored in lowercase).',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @Column({ name: 'address', type: 'varchar', length: 255 })
  address: string;

  @ApiProperty({
    description: 'The blockchain chain ID associated with the pool.',
    example: 1, // Ethereum Mainnet
  })
  @Column({ name: 'chain_id', type: 'int' })
  chainId: number;

  @ApiProperty({
    description: 'The current block associated with the pool.',
    example: 15000000,
  })
  @Column({ name: 'current_block', type: 'bigint', default: 0 })
  currentBlock: number;
}
