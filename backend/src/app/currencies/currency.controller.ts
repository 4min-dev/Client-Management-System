import {
  Body,
  Controller,
  Get, Inject, Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CryptoService } from '../crypto/crypto.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CurrencyService } from './currency.service';
import { UpdatePistolRatesDto } from './dto/updatePistolRates.dto';
import { UpdateExchangeRatesDto } from './dto/updateExchangeRates.dto';

@Controller('currency')
export class CurrencyController {
  constructor(
    private cryptoService: CryptoService,
    private configService: ConfigService,
    private currencyService: CurrencyService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
  }

  @Get('/list')
  async getCurrencies() {
    return this.currencyService.getCurrencies();
  }

  @Get('/exchangeRates/list')
  async getExchangeRates() {
    const cacheKey = 'exchange_rates_list';
    const cached = await this.cacheManager.get(cacheKey);

    if (cached) {
      return cached;
    }

    const rates = await this.currencyService.getExchangeRates();
    await this.cacheManager.set(cacheKey, rates, 300000);

    return rates;
  }

  @Get('/pistolRates/list')
  async getPistolRates() {
    return this.currencyService.getPistolRates();
  }

  @Post('/pistolRates/update')
  async updatePistolRates(@Body() dto: UpdatePistolRatesDto) {
    await this.currencyService.updatePistolRates(dto);
  }

  @Post('/exchangeRates/update')
  async updateExchangeRates(@Body() dto: UpdateExchangeRatesDto) {
    await this.currencyService.updateExchangeRates(dto);
  }
}
