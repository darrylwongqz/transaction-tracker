import { Module } from '@nestjs/common';
import { EtherscanService } from './etherscan.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [EtherscanService],
  exports: [EtherscanService],
})
export class EtherscanModule {}
