import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingFactory } from './pricing.factory';
import { BinancePricingStrategy } from './strategies/binance-pricing.strategy';
import { BinanceModule } from '../integrations/binance/binance.module';

@Module({
  imports: [BinanceModule],
  providers: [PricingService, PricingFactory, BinancePricingStrategy],
  exports: [PricingService],
})
export class PricingModule {}
