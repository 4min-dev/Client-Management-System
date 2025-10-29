import stationOnFuels from './data/stationsOnFuels';
import prisma from '../prisma';
import * as dayjs from 'dayjs';

export async function seedStationsOnFuels() {
  for (const item of stationOnFuels) {
    await prisma.stationsOnFuels.upsert({
      where: {
        stationId_fuelId: {
          stationId: item.stationId,
          fuelId: item.fuelId,
        },
      },
      update: {
        assignedAt: new Date(),
      },
      create: {
        stationId: item.stationId,
        fuelId: item.fuelId,
        assignedAt: new Date(),
      },
    });
  }

  console.debug('[DEBUG] Seed fuels on station - Done!');
}
