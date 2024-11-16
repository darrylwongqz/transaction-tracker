import { Injectable } from '@nestjs/common';
import { PricingFactory } from './pricing.factory';
import { ProviderNameType } from './constants/provider.constants';

@Injectable()
export class PricingService {
  constructor(private readonly pricingFactory: PricingFactory) {}

  /**
   * Fetches Kline (candlestick) data for a given provider.
   *
   * @param provider - The name of the pricing provider (e.g., 'binance', 'coinbase').
   *                   Must be a valid value from `PROVIDERS`.
   * @param params - The parameters required by the specific provider's Kline API.
   *                 Each provider has its own parameter validation logic.
   *
   * @returns A promise that resolves to the Kline data in a consistent format.
   *          The format depends on the provider's strategy implementation.
   *
   * @example
   * ```typescript
   * const data = await pricingService.getKlineData('binance', {
   *   symbol: 'BTCUSDT',
   *   interval: '1m',
   *   startTime: 1609459200000,
   *   endTime: 1609545600000,
   * });
   * ```
   *
   * @throws `Error` if the provider is not supported (handled by `PricingFactory`).
   * @throws `BadRequestException` or similar if the provider's specific validation fails.
   */
  async getKlineData(provider: ProviderNameType, params: object) {
    // Get the appropriate strategy from the factory
    const strategy = this.pricingFactory.getStrategy(provider);

    // Call the strategy's `getKlineData` method
    return strategy.getKlineData(params);
  }
}
