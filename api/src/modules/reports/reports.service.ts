import { Injectable } from '@nestjs/common';
import { OliveType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OLIVE_TYPE_AR } from '../../common/constants/arabic-labels';
import { oliveTypePrintPayload } from '../../common/constants/olive-type-labels';
import { amountFromWeightQuintal, isFullPriceAid } from '../../common/constants/pricing';
import { SettingsService } from '../settings/settings.service';
import { SeasonScopeService } from '../../common/season/season-scope.service';
import { FinancialReportQueryDto } from './dto/financial-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private seasonScope: SeasonScopeService,
  ) {}

  private dateRange(query: FinancialReportQueryDto) {
    if (!query.dateFrom && !query.dateTo) return undefined;
    return {
      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: new Date(query.dateTo + 'T23:59:59') } : {}),
    };
  }

  /** Regroupe les pesées par client — valeurs cumulées, une ligne par client. */
  private aggregateEntriesByClient(
    entries: Array<{
      clientId: string;
      referenceNumber: number;
      bagCount: number;
      totalWeightKg: { toString(): string } | number;
      adhlefCount: number | null;
      capacity: { toString(): string } | number | null;
      client: {
        id: string;
        clientNumber: number;
        firstName: string;
        lastName: string;
        phone: string | null;
      };
      oliveType: OliveType;
      pressingRecord?: unknown;
    }>,
  ) {
    const map = new Map<
      string,
      {
        clientId: string;
        client: (typeof entries)[0]['client'];
        oliveType: OliveType;
        bags: number;
        weightKg: number;
        adhlef: number;
        capacity: number;
        entryCount: number;
        lastReferenceNumber: number;
      }
    >();

    for (const e of entries) {
      const existing = map.get(e.clientId);
      const weight = Number(e.totalWeightKg);
      const cap = Number(e.capacity ?? 0);
      if (!existing) {
        map.set(e.clientId, {
          clientId: e.clientId,
          client: e.client,
          oliveType: e.oliveType,
          bags: e.bagCount,
          weightKg: weight,
          adhlef: e.adhlefCount ?? 0,
          capacity: cap,
          entryCount: 1,
          lastReferenceNumber: e.referenceNumber,
        });
      } else {
        existing.bags += e.bagCount;
        existing.weightKg += weight;
        existing.adhlef += e.adhlefCount ?? 0;
        existing.capacity += cap;
        existing.entryCount += 1;
        existing.lastReferenceNumber = Math.max(
          existing.lastReferenceNumber,
          e.referenceNumber,
        );
      }
    }

    return [...map.values()].sort(
      (a, b) => a.client.clientNumber - b.client.clientNumber,
    );
  }

  private aggregateFinancialByClient(
    records: Array<{
      id: string;
      treatmentDate: Date;
      amount: { toString(): string } | number;
      aidAmount: { toString(): string } | number;
      oliveEntry: {
        referenceNumber: number;
        clientId: string;
        client: { firstName: string; lastName: string };
      };
    }>,
  ) {
    const map = new Map<
      string,
      {
        id: string;
        date: Date;
        clientName: string;
        referenceNumber: number;
        entryCount: number;
        amount: number;
        aid: number;
      }
    >();

    for (const r of records) {
      const cid = r.oliveEntry.clientId;
      const amount = Number(r.amount);
      const aid = Number(r.aidAmount);
      const name = `${r.oliveEntry.client.firstName} ${r.oliveEntry.client.lastName}`.trim();
      const existing = map.get(cid);

      if (!existing) {
        map.set(cid, {
          id: r.id,
          date: r.treatmentDate,
          clientName: name,
          referenceNumber: r.oliveEntry.referenceNumber,
          entryCount: 1,
          amount,
          aid,
        });
      } else {
        existing.amount += amount;
        existing.aid += aid;
        existing.entryCount += 1;
        existing.referenceNumber = Math.max(
          existing.referenceNumber,
          r.oliveEntry.referenceNumber,
        );
        if (r.treatmentDate > existing.date) {
          existing.date = r.treatmentDate;
          existing.id = r.id;
        }
      }
    }

    return [...map.values()].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }

  async financialDaily(query: FinancialReportQueryDto) {
    const seasonId = await this.seasonScope.getSeasonId();
    const treatmentDate = this.dateRange(query);

    const types = [OliveType.GREEN, OliveType.ZBOUCH, OliveType.RIPE] as const;

    const columns = await Promise.all(
      types.map(async (oliveType) => {
        const records = await this.prisma.pressingRecord.findMany({
          where: {
            oliveEntry: { seasonId, deletedAt: null, oliveType },
            ...(treatmentDate ? { treatmentDate } : {}),
          },
          orderBy: { treatmentDate: 'desc' },
          include: {
            oliveEntry: {
              select: {
                referenceNumber: true,
                clientId: true,
                client: { select: { firstName: true, lastName: true } },
              },
            },
          },
        });

        const aggregated = this.aggregateFinancialByClient(records);
        const totalAmount = aggregated.reduce((s, r) => s + r.amount, 0);
        const totalAid = aggregated.reduce((s, r) => s + r.aid, 0);
        const fullAidCount = aggregated.filter((r) =>
          isFullPriceAid(r.amount, r.aid),
        ).length;

        return {
          oliveType,
          label: OLIVE_TYPE_AR[oliveType],
          totalAmount,
          totalAid,
          netTotal: totalAmount - totalAid,
          fullAidCount,
          transactions: aggregated.map((r) => ({
            id: r.id,
            date: r.date,
            referenceNumber: r.referenceNumber,
            entryCount: r.entryCount,
            clientName: r.clientName,
            amount: r.amount,
            aid: r.aid,
            fullAid: isFullPriceAid(r.amount, r.aid),
          })),
        };
      }),
    );

    const summary = columns.map((c) => ({
      label: c.label,
      amount: c.totalAmount,
      aid: c.totalAid,
      fullAidCount: c.fullAidCount,
    }));

    const grandAmount = summary.reduce((s, r) => s + r.amount, 0);
    const grandAid = summary.reduce((s, r) => s + r.aid, 0);

    return {
      columns,
      summary,
      grandTotal: grandAmount,
      grandAid,
      netTotal: grandAmount - grandAid,
    };
  }

  async financialSummary(query: FinancialReportQueryDto) {
    const daily = await this.financialDaily(query);
    return {
      oliveTotals: daily.summary.map((s) => ({
        label: s.label,
        weightKg: 0,
        count: daily.columns.find((c) => c.label === s.label)?.transactions.length ?? 0,
        amount: s.amount,
        aid: s.aid,
      })),
      totalRevenue: daily.grandTotal,
      totalAid: daily.grandAid,
      netProfit: daily.netTotal,
      grandTotal: daily.grandTotal,
    };
  }

  async clientReceiptData(clientId: string, filterOliveType?: OliveType) {
    const seasonId = await this.seasonScope.getSeasonId();
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, seasonId, deletedAt: null },
    });
    if (!client) return null;

    const oliveTypeScope = filterOliveType ?? client.oliveType;
    if (filterOliveType && client.oliveType !== filterOliveType) {
      return null;
    }

    const entries = await this.prisma.oliveEntry.findMany({
      where: {
        clientId,
        seasonId,
        deletedAt: null,
        oliveType: oliveTypeScope,
      },
      orderBy: [{ oliveType: 'asc' }, { referenceNumber: 'asc' }],
    });

    const oliveTypes = [oliveTypePrintPayload(oliveTypeScope)];

    const settings = await this.settingsService.getAll();
    const settingsMap = Object.fromEntries(
      settings.settings.map((s: { key: string; value: unknown }) => [s.key, s.value]),
    ) as Record<string, unknown>;

    const totalBags = entries.reduce((s, e) => s + e.bagCount, 0);
    const totalWeightKg = entries.reduce((s, e) => s + Number(e.totalWeightKg), 0);
    const totalAdhlef = entries.reduce((s, e) => s + (e.adhlefCount ?? 0), 0);
    const totalCapacity = entries.reduce(
      (s, e) => s + Number(e.capacity ?? 0),
      0,
    );
    const pricePerQuintal = await this.settingsService.getPricePerQuintal();
    const totalAmount = amountFromWeightQuintal(pricePerQuintal, totalWeightKg);

    const byOliveType = [OliveType.GREEN, OliveType.ZBOUCH, OliveType.RIPE].map(
      (type) => {
        const list = entries.filter((e) => e.oliveType === type);
        if (!list.length) return null;
        return {
          ...oliveTypePrintPayload(type),
          entryCount: list.length,
          totalBags: list.reduce((s, e) => s + e.bagCount, 0),
          totalWeightKg: list.reduce((s, e) => s + Number(e.totalWeightKg), 0),
          totalAdhlef: list.reduce((s, e) => s + (e.adhlefCount ?? 0), 0),
          totalCapacity: list.reduce((s, e) => s + Number(e.capacity ?? 0), 0),
        };
      },
    ).filter(Boolean);

    return {
      company: {
        name: String(settingsMap.company_name ?? 'معصرة الزيتون'),
        pricePerQuintal,
      },
      seasonName: settings.activeSeason?.name ?? null,
      printedAt: new Date().toISOString(),
      oliveTypes,
      client: {
        clientNumber: client.clientNumber,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone ?? '',
      },
      weighing: {
        entryCount: entries.length,
        totalBags,
        totalWeightKg,
        totalAdhlef,
        totalCapacity,
        byOliveType,
      },
      financial: {
        totalAmount,
      },
    };
  }

  /** Données agrégées pour بطاقة تعريف — une carte par client. */
  async clientCardData(clientId: string, filterOliveType?: OliveType) {
    const seasonId = await this.seasonScope.getSeasonId();
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, seasonId, deletedAt: null },
    });
    if (!client) return null;

    const oliveTypeScope = filterOliveType ?? client.oliveType;
    if (filterOliveType && client.oliveType !== filterOliveType) {
      return null;
    }

    const entries = await this.prisma.oliveEntry.findMany({
      where: {
        clientId,
        seasonId,
        deletedAt: null,
        oliveType: oliveTypeScope,
      },
    });

    if (!entries.length) return null;

    const settings = await this.settingsService.getAll();

    return {
      seasonName: settings.activeSeason?.name ?? null,
      entryCount: entries.length,
      oliveType: oliveTypePrintPayload(oliveTypeScope),
      client: {
        clientNumber: client.clientNumber,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
      },
      bags: entries.reduce((s, e) => s + e.bagCount, 0),
      weightKg: entries.reduce((s, e) => s + Number(e.totalWeightKg), 0),
      adhlef: entries.reduce((s, e) => s + (e.adhlefCount ?? 0), 0),
      capacity: entries.reduce((s, e) => s + Number(e.capacity ?? 0), 0),
    };
  }

  async receiptData(oliveEntryId: string) {
    const entry = await this.prisma.oliveEntry.findFirst({
      where: { id: oliveEntryId, deletedAt: null },
      include: {
        client: true,
        pressingRecord: true,
      },
    });
    if (!entry) return null;

    const settings = await this.settingsService.getAll();
    const p = entry.pressingRecord;
    const amount = p ? Number(p.amount) : 0;

    const settingsMap = Object.fromEntries(
      settings.settings.map((s) => [s.key, s.value]),
    ) as Record<string, unknown>;

    return {
      company: {
        name: String(settingsMap.company_name ?? 'معصرة الزيتون'),
      },
      referenceNumber: entry.referenceNumber,
      oliveType: oliveTypePrintPayload(entry.oliveType),
      client: {
        clientNumber: entry.client.clientNumber,
        firstName: entry.client.firstName,
        lastName: entry.client.lastName,
        phone: entry.client.phone,
      },
      totalWeightKg: Number(entry.totalWeightKg),
      pressing: p
        ? {
            oilQuantityL: Number(p.oilQuantityL),
            yieldPercent: p.yieldPercent ? Number(p.yieldPercent) : null,
            amount,
          }
        : null,
    };
  }

  async printBatch(
    oliveType: OliveType,
    fromRef?: number,
    toRef?: number,
    printType: 'receipt' | 'cards' | 'phones' = 'receipt',
  ) {
    const seasonId = await this.seasonScope.getSeasonId();
    const entriesInRange = await this.prisma.oliveEntry.findMany({
      where: {
        seasonId,
        deletedAt: null,
        oliveType,
        ...(fromRef || toRef
          ? {
              referenceNumber: {
                ...(fromRef ? { gte: fromRef } : {}),
                ...(toRef ? { lte: toRef } : {}),
              },
            }
          : {}),
      },
      select: { clientId: true },
    });

    const clientIds = [...new Set(entriesInRange.map((e) => e.clientId))];
    if (clientIds.length === 0) {
      if (printType === 'phones') {
        const { settings, activeSeason } = await this.settingsService.getAll();
        const settingsMap = Object.fromEntries(
          settings.map((s: { key: string; value: unknown }) => [s.key, s.value]),
        );
        return {
          type: 'phones' as const,
          meta: {
            title: `قائمة أرقام الهواتف — ${OLIVE_TYPE_AR[oliveType]}`,
            oliveType,
            oliveTypePrint: oliveTypePrintPayload(oliveType),
            companyName: String(settingsMap.company_name ?? 'معصرة الزيتون'),
            seasonName: activeSeason?.name ?? null,
            printedAt: new Date().toISOString(),
            referenceFrom: fromRef ?? null,
            referenceTo: toRef ?? null,
            total: 0,
          },
          rows: [],
        };
      }
      return [];
    }

    const allClientEntries = await this.prisma.oliveEntry.findMany({
      where: { seasonId, deletedAt: null, oliveType, clientId: { in: clientIds } },
      orderBy: { referenceNumber: 'asc' },
      include: { client: true, pressingRecord: true, weights: true },
    });

    const aggregated = this.aggregateEntriesByClient(allClientEntries);

    if (printType === 'phones') {
      const { settings, activeSeason } = await this.settingsService.getAll();
      const settingsMap = Object.fromEntries(
        settings.map((s: { key: string; value: unknown }) => [s.key, s.value]),
      );

      return {
        type: 'phones' as const,
        meta: {
          title: `قائمة أرقام الهواتف — ${OLIVE_TYPE_AR[oliveType]}`,
          oliveType,
          oliveTypePrint: oliveTypePrintPayload(oliveType),
          companyName: String(settingsMap.company_name ?? 'معصرة الزيتون'),
          seasonName: activeSeason?.name ?? null,
          printedAt: new Date().toISOString(),
          referenceFrom: fromRef ?? null,
          referenceTo: toRef ?? null,
          total: aggregated.length,
        },
        rows: aggregated.map((row) => ({
          clientNumber: row.client.clientNumber,
          lastName: row.client.lastName,
          firstName: row.client.firstName,
          phone: row.client.phone ?? '',
        })),
      };
    }

    return aggregated.map((row) => ({
      clientId: row.clientId,
      referenceNumber: row.client.clientNumber,
      lastReferenceNumber: row.lastReferenceNumber,
      entryCount: row.entryCount,
      oliveType: oliveTypePrintPayload(row.oliveType),
      client: row.client,
      bags: row.bags,
      weightKg: row.weightKg,
      adhlef: row.adhlef,
      capacity: row.capacity,
    }));
  }
}
