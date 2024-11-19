import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';

export class BinanceKlineDto {
  @ApiProperty({
    description: 'Kline open time in milliseconds',
    example: 1499040000000,
  })
  @IsNumber()
  openTime: number;

  @ApiProperty({ description: 'Open price', example: '0.01634790' })
  @IsString()
  open: string;

  @ApiProperty({ description: 'High price', example: '0.80000000' })
  @IsString()
  high: string;

  @ApiProperty({ description: 'Low price', example: '0.01575800' })
  @IsString()
  low: string;

  @ApiProperty({ description: 'Close price', example: '0.01577100' })
  @IsString()
  close: string;

  @ApiProperty({ description: 'Volume', example: '148976.11427815' })
  @IsString()
  volume: string;

  @ApiProperty({
    description: 'Kline close time in milliseconds',
    example: 1499644799999,
  })
  @IsNumber()
  closeTime: number;

  @ApiProperty({ description: 'Quote asset volume', example: '2434.19055334' })
  @IsString()
  quoteAssetVolume: string;

  @ApiProperty({ description: 'Number of trades', example: 308 })
  @IsNumber()
  numberOfTrades: number;

  @ApiProperty({
    description: 'Taker buy base asset volume',
    example: '1756.87402397',
  })
  @IsString()
  takerBuyBaseVolume: string;

  @ApiProperty({
    description: 'Taker buy quote asset volume',
    example: '28.46694368',
  })
  @IsString()
  takerBuyQuoteVolume: string;
}
/**
 * Data Transfer Object for the response from Binance Kline API
 */
export class BinanceKlineResponseDto {
  @Expose()
  @ApiProperty({ description: 'Total number of klines returned', example: 500 })
  @IsNumber()
  total: number;

  @Expose()
  @ApiProperty({
    description: 'Array of klines',
    type: [BinanceKlineDto],
  })
  @ValidateNested({ each: true })
  @Type(() => BinanceKlineDto)
  klines: BinanceKlineDto[];
}
