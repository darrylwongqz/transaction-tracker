import { Module } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [BinanceService],
  exports: [BinanceService],
})
export class BinanceModule {}
