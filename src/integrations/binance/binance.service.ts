import { HttpService } from '@nestjs/axios';
import { Injectable, BadRequestException } from '@nestjs/common';
import {
  BINANCE_BASE_URL,
  BINANCE_KLINES_ENDPOINT,
} from './constants/binance-api.constants';
import { BinanceKlineParamDto } from './dtos/request/binance-kline-param.dto';
import {
  BinanceKlineDto,
  BinanceKlineResponseDto,
} from './dtos/response/binance-kline-response.dto';

@Injectable()
export class BinanceService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Fetches Kline (candlestick) data from Binance API
   * @param params - Query parameters for Kline data
   * @returns A Promise that resolves to the KlineResponseDto
   */
  async getKlineData(
    params: BinanceKlineParamDto,
  ): Promise<BinanceKlineResponseDto> {
    if (!params.symbol || !params.interval) {
      throw new BadRequestException('Symbol and interval are required fields');
    }

    const url = `${BINANCE_BASE_URL}${BINANCE_KLINES_ENDPOINT}`;
    const queryParams = {
      ...params,
      timeZone: params.timeZone ?? '0', // Default to UTC if not provided
    };

    try {
      const response = await this.httpService.axiosRef.get(url, {
        params: queryParams,
      });
      const klines = this.mapKlines(response.data);

      return { total: klines.length, klines };
    } catch (error) {
      throw new BadRequestException(
        `Error fetching Kline data: ${error.message}`,
      );
    }
  }

  /**
   * Maps raw Kline data from Binance API to structured KlineDto objects
   * @param rawKlines - Array of raw Kline data from Binance API
   * @returns Array of structured KlineDto objects
   */
  private mapKlines(rawKlines: any[]): BinanceKlineDto[] {
    if (!Array.isArray(rawKlines)) {
      throw new BadRequestException('Invalid Kline data format');
    }

    return rawKlines.map((kline) => {
      if (!Array.isArray(kline) || kline.length < 11) {
        throw new BadRequestException('Malformed Kline data received');
      }

      return {
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
        quoteAssetVolume: kline[7],
        numberOfTrades: kline[8],
        takerBuyBaseVolume: kline[9],
        takerBuyQuoteVolume: kline[10],
      } as BinanceKlineDto;
    });
  }
}
