import { BinanceKlineParamDto } from '../../integrations/binance/dtos/request/binance-kline-param.dto';
import { BinanceKlineResponseDto } from '../../integrations/binance/dtos/response/binance-kline-response.dto';
/**
 * Available Providers
 *
 * This object defines the available providers for fetching kline data.
 * Add more providers as needed.
 */
export const PROVIDERS = {
  BINANCE: 'binance',
  // Add more providers here (e.g., COINBASE, KRAKEN)
} as const;

/**
 * ProviderNameType
 *
 * A union type representing the keys of the `PROVIDERS` object.
 * This ensures type safety when working with provider names.
 */
export type ProviderNameType = (typeof PROVIDERS)[keyof typeof PROVIDERS];

/**
 * ProviderKlineDto
 *
 * A type alias for the kline DTOs used by different providers.
 * Extend this type union as more providers are added.
 */
export type ProviderKlineParamDto = BinanceKlineParamDto;

export type ProviderKlineResponseDto = BinanceKlineResponseDto;
