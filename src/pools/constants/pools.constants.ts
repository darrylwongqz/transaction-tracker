/**
 * Chain Map for Blockchain Networks
 *
 * This map centralizes the chain IDs for supported blockchains,
 * ensuring consistency and maintainability across the application.
 * Each chain type corresponds to a specific chain ID used in handlers
 * and constants throughout the application.
 *
 * --- Example Usage ---
 * - Refer to `CHAIN_MAP.ETHEREUM` to get the chain ID for Ethereum Mainnet.
 * - Use `CHAIN_MAP.SOLANA` to fetch the chain ID for Solana Mainnet.
 *
 * --- Scaling Considerations ---
 * For applications supporting a growing number of blockchains:
 * - Use a database or configuration service to dynamically manage chain IDs.
 * - Synchronize with blockchain metadata services (e.g., Chainlist.org)
 *   for updates to chain IDs or blockchain specifications.
 */
export const CHAIN_MAP = {
  ETHEREUM_MAINNET: 1, // Ethereum Mainnet Chain ID
  SOLANA_MAINNET: 101, // Solana Mainnet Chain ID
};

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
export const USDC_WETH_POOL_INFO = {
  address: '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640',
  chainId: CHAIN_MAP.ETHEREUM_MAINNET, // Ethereum Mainnet
  token0: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  token1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  createdBlock: 21202122,
};

/**
 * Pool Configuration for Solana USDC/SOL Pair (Example)
 *
 * This file includes a configuration example for a Solana-based USDC/SOL pool.
 * See the earlier detailed notes for more information.
 */
export const SOLANA_USDC_POOL_INFO = {
  address: '4UqarBqCVuPQrBCJKMvuogXaGxaJHqHJuj5zwgKpSpSH', // Solana pool address in Base58 format
  chainId: CHAIN_MAP.SOLANA_MAINNET, // Solana Mainnet Chain ID
  createdBlock: 987654, // Replace with the starting block for Solana
  token0: {
    symbol: 'USDC',
    address: '8USDCwFAR45QztmgfxSWfCSdTg7GnqKnqdH7mL7VXJZx', // Replace with actual USDC token address on Solana
    decimals: 6,
  },
  token1: {
    symbol: 'SOL',
    address: 'So11111111111111111111111111111111111111112', // Replace with actual SOL token address on Solana
    decimals: 9,
  },
  description: 'Solana USDC/SOL Pool', // Optional description for documentation or logs
};
