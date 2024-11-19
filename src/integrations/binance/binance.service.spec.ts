// binance.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { BinanceService } from './binance.service';
import { HttpService } from '@nestjs/axios';
import {
  BinanceKlineInterval,
  BinanceKlineParamDto,
} from './dtos/request/binance-kline-param.dto';
import { BinanceKlineDto } from './dtos/response/binance-kline-response.dto';
import { validate } from 'class-validator';
import { Logger, BadRequestException } from '@nestjs/common';

describe('BinanceService', () => {
  let service: BinanceService;
  let httpService: HttpService;

  const mockRawResponse = {
    data: [
      [
        1731594900000, // Open time
        '3191.39000000', // Open
        '3192.79000000', // High
        '3140.00000000', // Low
        '3153.98000000', // Close
        '11938.17540000', // Volume
        1731595199999, // Close time
        '37710538.89085000', // Quote asset volume
        70573, // Number of trades
        '4648.02710000', // Taker buy base volume
        '14672225.51956000', // Taker buy quote volume
        '0', // Ignore
      ],
    ],
  };

  const mockMappedKlines: BinanceKlineDto[] = mockRawResponse.data.map(
    (kline) =>
      ({
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
      }) as BinanceKlineDto,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BinanceService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BinanceService>(BinanceService);
    httpService = module.get<HttpService>(HttpService);

    // Mock Logger methods to suppress logs during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'verbose').mockImplementation(() => {});

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getKlineData', () => {
    it('should return a mapped KlineResponseDto when valid data is provided', async () => {
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockResolvedValueOnce(mockRawResponse);

      const params: BinanceKlineParamDto = {
        symbol: 'BTCUSDT',
        interval: BinanceKlineInterval.MIN_1,
        startTime: 1731594900000,
        endTime: 1731595200000,
      };

      const result = await service.getKlineData(params);

      expect(result).toEqual({
        total: mockMappedKlines.length,
        klines: mockMappedKlines,
      });

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v3/klines'),
        {
          params: { ...params, timeZone: '0' },
        },
      );
      expect(httpService.axiosRef.get).toHaveBeenCalledTimes(1);
    });

    it('should fetch the most recent klines if startTime and endTime are not provided', async () => {
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockResolvedValueOnce(mockRawResponse);

      const params: BinanceKlineParamDto = {
        symbol: 'BTCUSDT',
        interval: BinanceKlineInterval.MIN_1,
      };

      const result = await service.getKlineData(params);

      expect(result).toEqual({
        total: mockMappedKlines.length,
        klines: mockMappedKlines,
      });

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v3/klines'),
        {
          params: { ...params, timeZone: '0' },
        },
      );
    });

    it('should handle the maximum limit of 1000 klines', async () => {
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockResolvedValueOnce(mockRawResponse);

      const params: BinanceKlineParamDto = {
        symbol: 'BTCUSDT',
        interval: BinanceKlineInterval.MIN_1,
        limit: 1000,
      };

      await service.getKlineData(params);

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v3/klines'),
        {
          params: { ...params, timeZone: '0' },
        },
      );
    });

    it('should throw an error for invalid limit values', async () => {
      const invalidParams: BinanceKlineParamDto = {
        symbol: 'BTCUSDT',
        interval: BinanceKlineInterval.MIN_1,
        limit: 1500, // Invalid limit
      };

      const validationErrors = await validate(
        Object.assign(new BinanceKlineParamDto(), invalidParams),
      );

      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].constraints).toEqual(
        expect.objectContaining({
          max: expect.stringContaining('limit must not be greater than 1000'),
        }),
      );
    });

    it('should throw an error if "symbol" is missing', async () => {
      const invalidParams = {
        symbol: '',
        interval: BinanceKlineInterval.MIN_1,
        startTime: 1731594900000,
        endTime: 1731595200000,
      } as unknown as BinanceKlineParamDto;

      await expect(service.getKlineData(invalidParams)).rejects.toThrow(
        'Symbol and interval are required fields',
      );
    });

    it('should throw an error if "interval" is missing', async () => {
      const invalidParams = {
        symbol: 'BTCUSDT',
        interval: '' as unknown as BinanceKlineInterval,
        startTime: 1731594900000,
        endTime: 1731595200000,
      } as BinanceKlineParamDto;

      await expect(service.getKlineData(invalidParams)).rejects.toThrow(
        'Symbol and interval are required fields',
      );
    });

    it('should validate and throw an error for invalid timeZone', async () => {
      const invalidParams: BinanceKlineParamDto = {
        symbol: 'ETHUSDT',
        interval: BinanceKlineInterval.MIN_1,
        timeZone: '15:00', // Invalid
      };

      const validationErrors = await validate(
        Object.assign(new BinanceKlineParamDto(), invalidParams),
      );

      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].constraints).toEqual(
        expect.objectContaining({
          BinanceTimeZoneConstraint: expect.stringContaining(
            'Invalid timeZone format',
          ),
        }),
      );
    });

    it('should apply default timeZone if not provided', async () => {
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockResolvedValueOnce(mockRawResponse);

      const params: BinanceKlineParamDto = {
        symbol: 'BTCUSDT',
        interval: BinanceKlineInterval.MIN_1,
        startTime: 1731594900000,
        endTime: 1731595200000,
      };

      await service.getKlineData(params);

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v3/klines'),
        {
          params: { ...params, timeZone: '0' },
        },
      );
    });

    it('should handle an empty response from Binance API', async () => {
      jest
        .spyOn(httpService.axiosRef, 'get')
        .mockResolvedValueOnce({ data: [] });

      const params: BinanceKlineParamDto = {
        symbol: 'BTCUSDT',
        interval: BinanceKlineInterval.MIN_1,
      };

      const result = await service.getKlineData(params);

      expect(result).toEqual({ total: 0, klines: [] });
    });

    it('should throw an error if Binance API response is malformed', async () => {
      jest.spyOn(httpService.axiosRef, 'get').mockResolvedValueOnce({
        data: {},
      });

      const params: BinanceKlineParamDto = {
        symbol: 'BTCUSDT',
        interval: BinanceKlineInterval.MIN_1,
      };

      await expect(service.getKlineData(params)).rejects.toThrow(
        'Invalid Kline data format',
      );
    });

    it('should throw an error if the API endpoint is invalid', async () => {
      jest.spyOn(httpService.axiosRef, 'get').mockRejectedValueOnce({
        response: {
          status: 404,
          statusText: 'Not Found',
        },
        message: 'Request failed with status code 404',
      });

      const params: BinanceKlineParamDto = {
        symbol: 'BTCUSDT',
        interval: BinanceKlineInterval.MIN_1,
      };

      await expect(service.getKlineData(params)).rejects.toThrow(
        'Error fetching Kline data: Request failed with status code 404',
      );
    });

    it('should throw an error for unsupported Kline intervals', async () => {
      const invalidParams = {
        symbol: 'BTCUSDT',
        interval: 'invalid' as unknown as BinanceKlineInterval,
        startTime: 1731594900000,
        endTime: 1731595200000,
      } as BinanceKlineParamDto;

      const validationErrors = await validate(
        Object.assign(new BinanceKlineParamDto(), invalidParams),
      );

      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].constraints).toEqual(
        expect.objectContaining({
          isEnum: expect.stringContaining(
            'interval must be one of the supported values',
          ),
        }),
      );
    });
  });
});
