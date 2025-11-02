import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';
import prisma from 'prisma/prisma';
import { CurrencyType } from '@prisma/client';

@Injectable()
export class ExchangeRateSyncService {
    private readonly logger = new Logger(ExchangeRateSyncService.name);

    private readonly TARGET_CURRENCIES: CurrencyType[] = [
        CurrencyType.RUB,
        CurrencyType.USD,
        CurrencyType.EUR,
        CurrencyType.GEL,
    ];

    private readonly API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { }

    @Cron('*/30 * * * *')
    async syncExchangeRates() {
        try {
            const response = await axios.get(this.API_URL);
            const data = response.data;

            this.logger.log(`API данные: USD→AMD=${data.usd.amd}, USD→RUB=${data.usd.rub}`);

            if (!data.usd || !data.usd.amd) throw new Error('AMD не найден')

            if (!data.usd || !data.usd.amd) {
                throw new Error('AMD не найден в ответе API');
            }

            const usdRates = data.usd;
            const amdPerUsd = usdRates.amd;
            let updated = 0;

            for (const fromCurrency of this.TARGET_CURRENCIES) {
                const code = fromCurrency.toLowerCase();
                const usdToTarget = usdRates[code];

                if (usdToTarget === undefined) {
                    this.logger.warn(`Курс для ${code.toUpperCase()} не найден`);
                    continue;
                }

                const rateToAmd = amdPerUsd / usdToTarget;

                await prisma.exchangeRates.upsert({
                    where: {
                        fromCurrencyType_toCurrencyType: {
                            fromCurrencyType: fromCurrency,
                            toCurrencyType: CurrencyType.AMD,
                        },
                    },
                    update: {
                        rate: Number(rateToAmd.toFixed(4)),
                    },
                    create: {
                        fromCurrencyType: fromCurrency,
                        toCurrencyType: CurrencyType.AMD,
                        rate: Number(rateToAmd.toFixed(4)),
                    },
                });

                updated++;
            }

            await this.cacheManager.del('exchange_rates_list');

            this.logger.log(`✅ Обновлено ${updated} курсов + кэш сброшен`);
        } catch (error) {
            this.logger.error('Ошибка синхронизации курсов', error instanceof Error ? error.message : error);
        }
    }
}