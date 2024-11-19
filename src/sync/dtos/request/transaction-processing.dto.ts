import { ChainType } from '../../../pools/constants/pools.enums';

export class TransactionProcessingDto {
  contractAddress: string;
  address: string;
  startBlock: number;
  endBlock: number;
  poolAddress: string;
  chainId: number;
  chainType: ChainType;
}
