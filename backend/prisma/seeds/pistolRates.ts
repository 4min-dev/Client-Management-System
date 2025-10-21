import prisma from '../prisma';
import pistolRates from './data/pistolRates';

export async function seedPistolRates() {
  await Promise.all(
    pistolRates.map(async (pistolRate, _) => {
      await prisma.pistolRates.upsert({
        where: {
          id: pistolRate.id,
        },
        update: {},
        create: {
          id: pistolRate.id,
          currencyType: pistolRate.currencyType,
          rate: pistolRate.rate,
        },
      });
    }),
  );

  console.debug('[DEBUG] Seed pistol rates - Done!');
}
