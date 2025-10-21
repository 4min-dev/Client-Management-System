import prisma from '../prisma';
import stationsOptions from './data/stationsOptions';

export async function seedOptionsStations() {
  await Promise.all(
    stationsOptions.map(async (station, _) => {
      await prisma.stationsOptions.upsert({
        where: {
          id: station.id,
        },
        update: {},
        create: {
          id: station.id,
          shiftNotificationEnabled: station.shiftNotificationEnabled,
          calibrationNotificationEnabled:
            station.calibrationNotificationEnabled,
          seasonNotificationEnabled: station.seasonNotificationEnabled,
          receiptCoefficientEnabled: station.receiptCoefficientEnabled,
          fixshiftNotificationEnabled: station.fixshiftNotificationEnabled,
          seasonCount: station.seasonCount,
        },
      });
    }),
  );

  console.debug('[DEBUG] Seed stations options - Done!');
}
