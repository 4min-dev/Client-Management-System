import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrencyType, StationCryptoKey } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import * as dayjs from 'dayjs';
import prisma from 'prisma/prisma';
import fuel from 'prisma/seeds/data/fuel';
import { CryptoService } from 'src/app/crypto/crypto.service';
import { promisify } from 'util';
import { UpdatePistolRateDto, UpdatePistolRatesDto } from './dto/updatePistolRates.dto';
import { UpdateExchangeRateDto, UpdateExchangeRatesDto } from './dto/updateExchangeRates.dto';

@Injectable()
export class CurrencyService {
  constructor() {

  }

  getCurrencies() {
    return Object.values(CurrencyType);
  }

  getExchangeRates() {
    return prisma.exchangeRates.findMany({});
  }

  getPistolRates() {
    return prisma.pistolRates.findMany({});
  }

  async updatePistolRates(dto: UpdatePistolRatesDto) {
    return await Promise.all(dto.rates.map((t) => this.updatePistolRate(t)));
  }

  updatePistolRate(dto: UpdatePistolRateDto) {
    return prisma.pistolRates.update({
      where: {
        id: dto.id,
      },
      data: {
        rate: dto.rate,
      },
    });
  }

  async updateExchangeRates(dto: UpdateExchangeRatesDto) {
    return await Promise.all(dto.rates.map((t) => this.updateExchangeRate(t)));
  }

  updateExchangeRate(dto: UpdateExchangeRateDto) {
    return prisma.exchangeRates.update({
      where: {
        id: dto.id,
      },
      data: {
        rate: dto.rate,
      },
    });
  }
}
