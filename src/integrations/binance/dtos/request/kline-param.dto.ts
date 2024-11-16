import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  Max,
  Min,
  IsNotEmpty,
  IsEnum,
  ValidationArguments,
} from 'class-validator';
import { IsValidBinanceTimeZone } from '../../../../common/decorators/is-valid-binance-time-zone';

export enum KlineInterval {
  SECONDS = '1s',
  MIN_1 = '1m',
  MIN_3 = '3m',
  MIN_5 = '5m',
  MIN_15 = '15m',
  MIN_30 = '30m',
  HOUR_1 = '1h',
  HOUR_2 = '2h',
  HOUR_4 = '4h',
  HOUR_6 = '6h',
  HOUR_8 = '8h',
  HOUR_12 = '12h',
  DAY_1 = '1d',
  DAY_3 = '3d',
  WEEK_1 = '1w',
  MONTH_1 = '1M',
}

/**
 * Data Transfer Object for the query parameters to fetch Kline data
 */
export class KlineParamDto {
  @ApiProperty({
    description: 'The trading pair symbol (e.g., ETHUSDT)',
    example: 'ETHUSDT',
  })
  @IsNotEmpty()
  @IsString()
  symbol: string;

  @ApiProperty({
    description: 'Kline interval (e.g., 1m, 15m, 1h)',
    example: '1m',
    enum: KlineInterval,
  })
  @IsNotEmpty()
  @IsEnum(KlineInterval, {
    message: 'interval must be one of the supported values: 1s, 1m, 3m, etc.',
  })
  interval: KlineInterval;

  @ApiProperty({
    description: 'Start time in milliseconds (optional, UTC)',
    example: 1499040000000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  startTime?: number;

  @ApiProperty({
    description: 'End time in milliseconds (optional, UTC)',
    example: 1499644799999,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  endTime?: number;

  @ApiProperty({
    description: 'Time zone offset (optional, e.g., +2:00). Default: 0 (UTC)',
    example: '0',
    required: false,
  })
  @IsOptional()
  @IsValidBinanceTimeZone({
    message: ({ value }: ValidationArguments) =>
      `Invalid timeZone format: ${value}. Must be +/-HH:mm or valid hour offset.`,
  })
  timeZone?: string = '0'; // Default to UTC if not provided

  @ApiProperty({
    description: 'Maximum number of klines to return (default 500, max 1000)',
    example: 500,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}
