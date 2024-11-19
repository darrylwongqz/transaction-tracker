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
  // SOLANA_MAINNET: 101, // Solana Mainnet Chain ID -- NOTE DO NOT USE, ONLY FOR ILLUSTRATIVE PURPOSES
};
