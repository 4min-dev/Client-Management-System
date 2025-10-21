import { stat } from 'fs';
import prisma from '../prisma';
import stations from './data/stations';

export async function seedStations() {
  await Promise.all(
    stations.map(async (station, _) => {
      await prisma.station.upsert({
        where: {
          id: station.id,
        },
        update: {},
        create: {
          id: station.id,
          companyId: station.companyId,
          contactId: station.contactId,
          country: station.country,
          city: station.city,
          address: station.address,
          procCount: station.procCount,
          pistolCount: station.procCount,
          currencyType: station.currencyType,
          synchronize: station.synchronize,
          status: station.status,
          paidUntil: station.paidUntil,
          discount: station.discount,
          macAddress: station.macAddress,
          currencyValue: station.currencyValue,
          stationsOptionsId: station.stationsOptionsId,
        },
      });
    }),
  );

  console.debug('[DEBUG] Seed stations - Done!');
}
