import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PoolEntity } from '../entities/pools.entity';

@Injectable()
export class BasePoolHandlerService {
  constructor(
    @InjectRepository(PoolEntity)
    private readonly poolRepository: Repository<PoolEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getCurrentBlock(address: string, chainId: number): Promise<number> {
    if (!address || typeof address !== 'string') {
      throw new BadRequestException('Invalid address');
    }

    const pool = await this.poolRepository.findOneBy({
      address,
      chainId,
    });

    if (!pool) {
      throw new NotFoundException(
        `Pool not found for address ${address} on chainId ${chainId}`,
      );
    }

    return pool.currentBlock;
  }

  async setCurrentBlock(
    address: string,
    chainId: number,
    blockNumber: number,
  ): Promise<boolean> {
    if (!address) {
      throw new BadRequestException('Invalid address');
    }

    if (!chainId) {
      throw new BadRequestException('Invalid chainId');
    }

    if (blockNumber < 0) {
      throw new BadRequestException('Invalid block number');
    }

    const result = await this.poolRepository
      .createQueryBuilder()
      .update(PoolEntity)
      .set({ currentBlock: () => `GREATEST(currentBlock, ${blockNumber})` })
      .where('address = :address AND chainId = :chainId', {
        address: address.toLowerCase(),
        chainId,
      })
      .execute();

    return result.affected > 0;
  }
}
