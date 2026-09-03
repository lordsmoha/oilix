const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  try {
    const s = await p.season.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!s) {
      console.log('no season');
      return;
    }
    for (const src of ['STORED', 'FARMER']) {
      for (const typ of ['GREEN', 'TAIEB', 'DROU', 'ZEBBOUCHE']) {
        await p.oilStockBalance.upsert({
          where: {
            seasonId_oilSource_oilType: { seasonId: s.id, oilSource: src, oilType: typ },
          },
          create: { seasonId: s.id, oilSource: src, oilType: typ },
          update: {},
        });
      }
    }
    const n = await p.oilStockBalance.count({ where: { seasonId: s.id } });
    console.log('OK — balances for season', s.id, ':', n);
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
