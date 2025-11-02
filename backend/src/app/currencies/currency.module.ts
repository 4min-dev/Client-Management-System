import { Module } from '@nestjs/common';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { ConfigService } from '@nestjs/config';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { ExchangeRateSyncService } from './InecoExchangeRateSync.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [CurrencyController],
  providers: [CryptoService, ConfigService, CurrencyService, ExchangeRateSyncService],
})
export class CurrencyModule { }
