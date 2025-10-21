import { Module } from '@nestjs/common';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { ConfigService } from '@nestjs/config';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';

@Module({
  imports: [],
  controllers: [CurrencyController],
  providers: [CryptoService, ConfigService, CurrencyService],
})
export class CurrencyModule {}
