import fuel from './data/fuel';
import prisma from '../prisma';

export async function seedFuel() {
  await Promise.all(
    fuel.map(async (fuel, _) => {
      await prisma.fuel.upsert({
        where: {
          id: fuel.id,
        },
        update: {},
        create: {
          id: fuel.id,
          name: fuel.name
        },
      });
    }),
  );

  console.debug('[DEBUG] Seed fuels - Done!');
}
