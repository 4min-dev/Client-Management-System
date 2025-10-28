import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seeds/users';
import { seedExchangeRates } from './seeds/exchangeRates';
import { seedPistolRates } from './seeds/pistolRates';
import { seedFuel } from './seeds/fuel';
import { seedContacts } from './seeds/contacts';
import { seedCompanies } from './seeds/companies';
import { seedStations } from './seeds/stations';
import { seedStationsOnFuels } from './seeds/stationOnFuels';
import { seedStationsOptions } from './seeds/stationsOptions';

const prisma = new PrismaClient();

async function main() {
  await seedExchangeRates();
  await seedPistolRates();
  await seedFuel();

  await seedContacts();
  await seedCompanies();

  await seedUsers();

  await seedStationsOptions();

  await seedStations();

  await seedStationsOnFuels();

  console.debug('[DEBUG] Seed was successfully done!');
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
