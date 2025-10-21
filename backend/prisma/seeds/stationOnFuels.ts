import stationOnFuels from './data/stationsOnFuels';
import prisma from '../prisma';
import * as dayjs from 'dayjs';

export async function seedStationsOnFuels() {
  await Promise.all(
    stationOnFuels.map(async (item, _) => {
      await prisma.stationsOnFuels.upsert({
        where: {
          id: item.id,
        },
        update: {},
        create: {
          stationId: item.stationId,
          fuelId: item.fuelId,
          assignedAt: dayjs().toDate(),
        },
      });
    }),
  );

  console.debug('[DEBUG] Seed fuels on station - Done!');
}
