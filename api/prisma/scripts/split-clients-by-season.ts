/**
 * One-time data fix: duplicate client rows per season when entries span multiple seasons.
 * Run after applying migration 20260529133000_clients_per_season:
 *   npx ts-node prisma/scripts/split-clients-by-season.ts
 */
import { OliveType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pairs = await prisma.$queryRaw<
    { client_id: string; season_id: string }[]
  >`
    SELECT DISTINCT oe.client_id, oe.season_id
    FROM olive_entries oe
    WHERE oe.deleted_at IS NULL
  `;

  for (const { client_id: clientId, season_id: seasonId } of pairs) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.seasonId === seasonId) continue;

    let target = await prisma.client.findFirst({
      where: {
        seasonId,
        deletedAt: null,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone ?? undefined,
      },
    });

    if (!target) {
      const oliveType =
        (
          await prisma.oliveEntry.findFirst({
            where: { clientId, seasonId, deletedAt: null },
            select: { oliveType: true },
          })
        )?.oliveType ?? OliveType.GREEN;
      const last = await prisma.client.findFirst({
        where: { seasonId, oliveType, deletedAt: null },
        orderBy: { clientNumber: 'desc' },
      });
      target = await prisma.client.create({
        data: {
          seasonId,
          oliveType,
          clientNumber: (last?.clientNumber ?? 0) + 1,
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
          notes: client.notes,
        },
      });
      console.log(
        `Created client #${target.clientNumber} for season ${seasonId} (from ${clientId})`,
      );
    }

    await prisma.oliveEntry.updateMany({
      where: { clientId, seasonId, deletedAt: null },
      data: { clientId: target.id },
    });
  }

  // Renumber client_number per season + olive type (1..n by created_at)
  const seasons = await prisma.season.findMany({ select: { id: true, name: true } });
  for (const season of seasons) {
    for (const oliveType of Object.values(OliveType)) {
      const clients = await prisma.client.findMany({
        where: { seasonId: season.id, oliveType, deletedAt: null },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      });
      for (let i = 0; i < clients.length; i++) {
        const num = i + 1;
        if (clients[i].clientNumber !== num) {
          await prisma.client.update({
            where: { id: clients[i].id },
            data: { clientNumber: num },
          });
        }
      }
      console.log(
        `Renumbered ${clients.length} ${oliveType} clients for ${season.name}`,
      );
    }
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
