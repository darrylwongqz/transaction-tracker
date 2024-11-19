import { HttpService } from '@nestjs/axios';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(BinanceService.name);

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
      this.logger.error('Symbol and interval are required fields');
      throw new BadRequestException('Symbol and interval are required fields');
    }

    const url = `${BINANCE_BASE_URL}${BINANCE_KLINES_ENDPOINT}`;
    const queryParams = {
      ...params,
      timeZone: params.timeZone ?? '0', // Default to UTC if not provided
    };

    this.logger.debug(
      `Requesting Kline data from Binance API. URL: ${url}, Params: ${JSON.stringify(
        queryParams,
      )}`,
    );

    try {
      const response = await this.httpService.axiosRef.get(url, {
        params: queryParams,
      });

      this.logger.debug(
        `Successfully fetched Kline data. Length: ${response.data.length}`,
      );

      const klines = this.mapKlines(response.data);

      this.logger.log(
        `Mapped ${klines.length} Kline entries from Binance API response.`,
      );

      return { total: klines.length, klines };
    } catch (error) {
      this.logger.error(
        `Error fetching Kline data from Binance API: ${error.message}`,
        error.stack,
      );
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
      this.logger.error('Invalid Kline data format received from Binance API');
      throw new BadRequestException('Invalid Kline data format');
    }

    this.logger.debug(
      `Mapping ${rawKlines.length} Kline entries from raw data.`,
    );

    return rawKlines.map((kline, index) => {
      if (!Array.isArray(kline) || kline.length < 11) {
        this.logger.warn(
          `Malformed Kline data at index ${index}: ${JSON.stringify(kline)}`,
        );
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
