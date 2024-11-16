import { Injectable } from '@nestjs/common';
import { PricingStrategy } from './interfaces/pricing-strategy.interface';
import { BinancePricingStrategy } from './strategies/binance-pricing.strategy';
import { ProviderNameType, PROVIDERS } from './constants/provider.constants';

@Injectable()
export class PricingFactory {
  private readonly strategies: { [key: string]: PricingStrategy };

  constructor(private readonly binanceStrategy: BinancePricingStrategy) {
    // Map provider names to their strategies
    this.strategies = {
      [PROVIDERS.BINANCE]: this.binanceStrategy,
    };
  }

  /**
   * Retrieves the appropriate pricing strategy for a given provider.
   *
   * @param provider - The name of the provider (e.g., 'binance').
   *                   Must be a valid value from `ProviderNameType`.
   *
   * @returns An instance of the provider's pricing strategy implementing the `PricingStrategy` interface.
   *
   * @throws `Error` if the provider is not supported.
   */
  getStrategy(provider: ProviderNameType): PricingStrategy {
    const strategy = this.strategies[provider];
    if (!strategy) {
      throw new Error(`Pricing provider "${provider}" is not supported.`);
    }
    return strategy;
  }
}
