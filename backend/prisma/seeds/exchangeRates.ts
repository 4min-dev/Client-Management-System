import exchangeRates from './data/exchangeRates';
import prisma from '../prisma';

export async function seedExchangeRates() {
  await Promise.all(
    exchangeRates.map(async (exchangeRate, _) => {
      await prisma.exchangeRates.upsert({
        where: {
          id: exchangeRate.id,
        },
        update: {},
        create: {
          id: exchangeRate.id,
          fromCurrencyType: exchangeRate.fromCurrencyType,
          toCurrencyType: exchangeRate.toCurrencyType,
          rate: exchangeRate.rate,
        },
      });
    }),
  );

  console.debug('[DEBUG] Seed exchange rates - Done!');
}
