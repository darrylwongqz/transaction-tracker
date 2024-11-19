import { CHAIN_MAP } from '../../common/constants';
import { PoolInfo } from '../interfaces/pool-info.interface';
import { ChainType } from './pools.enums';

/**
 * Pool Configuration for USDC/WETH Pair
 *
 * This file stores static configuration for the USDC/WETH pool, including
 * the pool's address, token addresses, and the block number when the pool
 * was created. For a small application like this one, maintaining this
 * data in a constants file is sufficient and offers the following advantages:
 *
 * See the earlier detailed notes for more information.
 */
export const USDC_WETH_POOL_INFO: PoolInfo = {
  address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
  chainId: CHAIN_MAP.ETHEREUM_MAINNET, // Ethereum Mainnet
  token0: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  createdBlock: 21202122,
  chainType: ChainType.ETHEREUM,
  description: 'The USDC-WETH liquidity pool on the Ethereum Mainnet',
};

// Example of adding another pool
// export const DAI_USDC_POOL_INFO: PoolInfo = {
//   address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
//   chainId: CHAIN_MAP.ETHEREUM_MAINNET,
//   token0: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
//   token1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
//   createdBlock: 12345678,
//   chainType: ChainType.ETHEREUM,
//   description: 'The DAI-USDC liquidity pool on Ethereum Mainnet',
// };

/**
 * Pool Configuration for Solana USDC/SOL Pair (Example)
 *
 * This file includes a configuration example for a Solana-based USDC/SOL pool.
 * See the earlier detailed notes for more information.
 */
// export const SOLANA_USDC_POOL_INFO = {
//   address: '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH', // Solana pool address in Base58 format
//   chainId: CHAIN_MAP.SOLANA_MAINNET, // Solana Mainnet Chain ID
//   createdBlock: 987654, // Replace with the starting block for Solana
//   token0: '8USDCwFAR45QztmgfxSWfCSdTg7GnqKnqdH7mL7VXJZx',
//   token1: 'So11111111111111111111111111111111111111112',
//   description: 'Solana USDC/SOL Pool', // Optional description for documentation or logs
// };
