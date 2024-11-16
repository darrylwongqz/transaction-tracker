export const PROVIDERS = {
  BINANCE: 'binance',
  // Add more providers as needed
} as const;

export type ProviderNameType = (typeof PROVIDERS)[keyof typeof PROVIDERS]; // Type-safe provider values
