import { OliveType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clientStatsForType(seasonId: string, oliveType: OliveType) {
  const entryBase = { seasonId, deletedAt: null, oliveType };

  const [receptionCount, unmilledGroups, clientsWithEntries, entryCount] =
    await Promise.all([
      prisma.client.count({
        where: { seasonId, oliveType, deletedAt: null },
      }),
      prisma.oliveEntry.groupBy({
        by: ['clientId'],
        where: { ...entryBase, pressingRecord: { is: null } },
      }),
      prisma.oliveEntry.groupBy({
        by: ['clientId'],
        where: entryBase,
      }),
      prisma.oliveEntry.count({ where: entryBase }),
    ]);

  const unmilledIds = new Set(unmilledGroups.map((g) => g.clientId));
  const unmilledCount = unmilledIds.size;
  const milledCount = clientsWithEntries.filter(
    (g) => !unmilledIds.has(g.clientId),
  ).length;

  return { receptionCount, milledCount, unmilledCount, entryCount };
}

async function main() {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    orderBy: { startDate: 'desc' },
  });

  if (!season) {
    console.log('No active season found.');
    return;
  }

  console.log(`Season: ${season.name} (${season.id})\n`);

  for (const oliveType of [
    OliveType.GREEN,
    OliveType.ZBOUCH,
    OliveType.RIPE,
  ]) {
    const stats = await clientStatsForType(season.id, oliveType);
    console.log(oliveType);
    console.log(`  clients (reception): ${stats.receptionCount}`);
    console.log(`  milled clients:      ${stats.milledCount}`);
    console.log(`  unmilled clients:    ${stats.unmilledCount}`);
    console.log(`  total weighings:     ${stats.entryCount}`);
    console.log('');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
