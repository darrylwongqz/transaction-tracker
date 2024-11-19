import { ChainType } from '../constants/pools.enums';

export interface PoolInfo {
  address: string;
  chainId: number; // Using number for better type safety
  token0: string;
  token1: string;
  createdBlock: number;
  chainType: ChainType;
  description: string;
}
