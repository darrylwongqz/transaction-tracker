import { Injectable } from '@nestjs/common';
import { PricingStrategy } from '../interfaces/pricing-strategy.interface';
import { BinanceService } from '../../integrations/binance/binance.service';
import { BinanceKlineParamDto } from '../../integrations/binance/dtos/request/binance-kline-param.dto';
import { BinanceKlineResponseDto } from '../../integrations/binance/dtos/response/binance-kline-response.dto';

@Injectable()
export class BinancePricingStrategy implements PricingStrategy {
  constructor(private readonly binanceService: BinanceService) {}

  /**
   * Fetches Kline data from Binance.
   *
   * @param params - The parameters for fetching Kline data specific to Binance.
   *                 Includes symbol, interval, startTime, endTime, etc.
   *
   * @returns A Promise resolving to the Kline data in Binance's format.
   */
  async getKlineData(
    params: BinanceKlineParamDto,
  ): Promise<BinanceKlineResponseDto> {
    return this.binanceService.getKlineData(params);
  }
}
