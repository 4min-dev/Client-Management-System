// prisma/seeds/stations.ts
import { stat } from 'fs';
import prisma from '../prisma';
import stations from './data/stations';

export async function seedStations() {
  await Promise.all(
    stations.map(async (station) => {
      await prisma.stationsOptions.upsert({
        where: { id: station.stationsOptions.create.id },
        update: {
          shiftChangeEvents: station.stationsOptions.create.shiftChangeEvents,
          calibrationChangeEvents: station.stationsOptions.create.calibrationChangeEvents,
          seasonChangeEvents: station.stationsOptions.create.seasonChangeEvents,
          receiptCoefficient: station.stationsOptions.create.receiptCoefficient,
          fixShiftCount: station.stationsOptions.create.fixShiftCount,
          seasonCount: station.stationsOptions.create.seasonCount,
        },
        create: {
          id: station.stationsOptions.create.id,
          shiftChangeEvents: station.stationsOptions.create.shiftChangeEvents,
          calibrationChangeEvents: station.stationsOptions.create.calibrationChangeEvents,
          seasonChangeEvents: station.stationsOptions.create.seasonChangeEvents,
          receiptCoefficient: station.stationsOptions.create.receiptCoefficient,
          fixShiftCount: station.stationsOptions.create.fixShiftCount,
          seasonCount: station.stationsOptions.create.seasonCount,
        },
      });

      await prisma.station.upsert({
        where: { id: station.id },
        update: {
          companyId: station.companyId,
          contactId: station.contactId,
          country: station.country,
          city: station.city,
          address: station.address,
          procCount: station.procCount,
          pistolCount: station.pistolCount,
          currencyType: station.currencyType,
          synchronize: station.synchronize,
          status: station.status,
          paidUntil: station.paidUntil,
          discount: station.discount,
          macAddress: station.macAddress,
          currencyValue: station.currencyValue,
          stationsOptionsId: station.stationsOptionsId,
        },
        create: {
          id: station.id,
          companyId: station.companyId,
          contactId: station.contactId,
          country: station.country,
          city: station.city,
          address: station.address,
          procCount: station.procCount,
          pistolCount: station.pistolCount,
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