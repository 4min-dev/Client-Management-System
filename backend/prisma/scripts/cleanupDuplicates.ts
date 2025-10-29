// prisma/scripts/cleanupDuplicates.ts
import prisma from '../prisma';

async function cleanup() {
    const duplicates = await prisma.stationsOnFuels.groupBy({
        by: ['stationId', 'fuelId'],
        having: {
            id: { _count: { gt: 1 } },
        },
    });

    for (const dup of duplicates) {
        const records = await prisma.stationsOnFuels.findMany({
            where: { stationId: dup.stationId, fuelId: dup.fuelId },
            orderBy: { assignedAt: 'desc' },
        });

        const toDelete = records.slice(1).map(r => r.id);
        await prisma.stationsOnFuels.deleteMany({
            where: { id: { in: toDelete } },
        });
    }

    console.log('Дубликаты удалены!');
}

cleanup().then(() => prisma.$disconnect());