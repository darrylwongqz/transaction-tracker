import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class TransactionsQueryDto {
  @ApiProperty({
    required: true,
    description: 'Start timestamp in seconds',
    example: 1697240003,
  })
  @IsNumber()
  @IsPositive()
  readonly startTime: number;

  @ApiProperty({
    required: true,
    description: 'End timestamp in seconds',
    example: 1697240423,
  })
  @IsNumber()
  @IsPositive()
  readonly endTime: number;

  @ApiProperty({
    required: false,
    description: 'Default limit is 10',
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(1000)
  @Transform(({ value }) => value || 10)
  readonly limit?: number;

  @ApiProperty({
    required: false,
    description: 'Default skip is 0',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => value || 0)
  readonly skip?: number;
}
