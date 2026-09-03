/**
 * Migration données : numérotation client par type d'olive.
 * À exécuter après : prisma migrate deploy (ou migrate dev)
 *
 *   npx ts-node prisma/scripts/migrate-clients-per-olive-type.ts
 */
import { OliveType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OLIVE_ORDER: OliveType[] = [OliveType.GREEN, OliveType.ZBOUCH, OliveType.RIPE];

type RawClient = {
  id: string;
  season_id: string;
  client_number: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  notes: string | null;
  created_at: Date;
  olive_type: OliveType | null;
};

async function ensureConstraints() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "clients" ALTER COLUMN "olive_type" SET NOT NULL;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "clients_season_id_olive_type_client_number_key"
      ON "clients"("season_id", "olive_type", "client_number");
  `);
}

async function assignPrimaryOliveTypes() {
  await prisma.$executeRawUnsafe(`
    UPDATE "clients" c
    SET "olive_type" = sub.olive_type
    FROM (
      SELECT DISTINCT ON (oe.client_id)
        oe.client_id,
        oe.olive_type
      FROM "olive_entries" oe
      WHERE oe.deleted_at IS NULL
      ORDER BY oe.client_id,
        CASE oe.olive_type
          WHEN 'GREEN' THEN 1
          WHEN 'ZBOUCH' THEN 2
          ELSE 3
        END,
        oe.entry_date ASC
    ) sub
    WHERE c.id = sub.client_id AND c.deleted_at IS NULL AND c.olive_type IS NULL;
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "clients" SET "olive_type" = 'GREEN'
    WHERE "olive_type" IS NULL AND "deleted_at" IS NULL;
  `);
}

async function main() {
  await assignPrimaryOliveTypes();

  const clients = await prisma.$queryRaw<RawClient[]>`
    SELECT id, season_id, client_number, first_name, last_name, phone, notes, created_at, olive_type
    FROM clients
    WHERE deleted_at IS NULL
    ORDER BY created_at ASC, id ASC
  `;

  console.log(`Processing ${clients.length} clients…`);

  for (const client of clients) {
    const entryTypes = await prisma.oliveEntry.findMany({
      where: {
        clientId: client.id,
        seasonId: client.season_id,
        deletedAt: null,
      },
      select: { oliveType: true },
      distinct: ['oliveType'],
    });

    const types = OLIVE_ORDER.filter((t) =>
      entryTypes.some((e) => e.oliveType === t),
    );

    if (types.length === 0) continue;

    const [primary, ...others] = types;
    if (client.olive_type !== primary) {
      await prisma.$executeRaw`
        UPDATE clients SET olive_type = ${primary}::"OliveType" WHERE id = ${client.id}
      `;
    }

    for (const oliveType of others) {
      let target = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM clients
        WHERE season_id = ${client.season_id}
          AND olive_type = ${oliveType}::"OliveType"
          AND deleted_at IS NULL
          AND first_name = ${client.first_name}
          AND last_name = ${client.last_name}
          AND (phone IS NOT DISTINCT FROM ${client.phone})
        LIMIT 1
      `;

      let targetId = target[0]?.id;

      if (!targetId) {
        const created = await prisma.$queryRaw<{ id: string }[]>`
          INSERT INTO clients (
            id, season_id, olive_type, client_number, first_name, last_name, phone, notes, created_at, updated_at
          ) VALUES (
            gen_random_uuid(),
            ${client.season_id},
            ${oliveType}::"OliveType",
            0,
            ${client.first_name},
            ${client.last_name},
            ${client.phone},
            ${client.notes},
            ${client.created_at},
            NOW()
          )
          RETURNING id
        `;
        targetId = created[0].id;
        console.log(`Split client ${client.id} → new ${targetId} (${oliveType})`);
      }

      const moved = await prisma.oliveEntry.updateMany({
        where: {
          clientId: client.id,
          seasonId: client.season_id,
          oliveType,
          deletedAt: null,
        },
        data: { clientId: targetId },
      });
      if (moved.count > 0) {
        console.log(
          `Moved ${moved.count} ${oliveType} entries from ${client.id} to ${targetId}`,
        );
      }
    }
  }

  const seasons = await prisma.season.findMany({ select: { id: true, name: true } });
  for (const season of seasons) {
    for (const oliveType of OLIVE_ORDER) {
      const list = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM clients
        WHERE season_id = ${season.id}
          AND olive_type = ${oliveType}::"OliveType"
          AND deleted_at IS NULL
        ORDER BY created_at ASC, id ASC
      `;
      for (let i = 0; i < list.length; i++) {
        const num = i + 1;
        await prisma.$executeRaw`
          UPDATE clients SET client_number = ${num} WHERE id = ${list[i].id}
        `;
      }
      console.log(
        `Renumbered ${list.length} ${oliveType} clients for ${season.name}`,
      );
    }
  }

  await ensureConstraints();
  console.log('Migration clients per olive type: done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
