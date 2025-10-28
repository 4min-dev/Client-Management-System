// prisma/seeds/stationsOptions.ts
import prisma from '../prisma';
import stations from './data/stations';

export async function seedStationsOptions() {
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
    }),
  );

  console.debug('[DEBUG] Seed stations options - Done!');
}