import { Injectable } from '@nestjs/common';
import { OliveType } from '@prisma/client';
import { OLIVE_TYPE_AR } from '../../common/constants/arabic-labels';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { SeasonScopeService } from '../../common/season/season-scope.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private seasonScope: SeasonScopeService,
  ) {}

  /**
   * Statistiques par type d'olive — chaque client compté une seule fois.
   * - subscriptionsCount : clients enregistrés (table clients)
   * - unmilledCount : clients ayant au moins une pesée sans pressingRecord
   * - milledCount : clients avec pesées dont toutes sont pressées
   */
  private async clientStatsForType(seasonId: string, oliveType: OliveType) {
    const entryBase = { seasonId, deletedAt: null, oliveType };

    const [receptionCount, unmilledClientGroups, clientsWithEntries] =
      await Promise.all([
        this.prisma.client.count({
          where: { seasonId, oliveType, deletedAt: null },
        }),
        this.prisma.oliveEntry.groupBy({
          by: ['clientId'],
          where: { ...entryBase, pressingRecord: { is: null } },
        }),
        this.prisma.oliveEntry.groupBy({
          by: ['clientId'],
          where: entryBase,
        }),
      ]);

    const unmilledClientIds = new Set(
      unmilledClientGroups.map((g) => g.clientId),
    );
    const unmilledCount = unmilledClientIds.size;
    const milledCount = clientsWithEntries.filter(
      (g) => !unmilledClientIds.has(g.clientId),
    ).length;

    return { receptionCount, milledCount, unmilledCount };
  }

  async getStats() {
    const seasonId = await this.seasonScope.getSeasonId();
    const season = await this.seasonScope.getSeason();
    const pricePerQuintal = await this.settingsService.getPricePerQuintal();
    const companyName = await this.settingsService.get<string>(
      'company_name',
      'معصرة الزيتون - الصفا والمروة - المصيف',
    );

    const types = [OliveType.GREEN, OliveType.ZBOUCH, OliveType.RIPE] as const;

    const byType = await Promise.all(
      types.map(async (oliveType) => {
        const base = { seasonId, deletedAt: null, oliveType };
        const [lastClient, lastMilledEntry, clientStats] = await Promise.all([
          this.prisma.client.findFirst({
            where: { seasonId, oliveType, deletedAt: null },
            orderBy: { clientNumber: 'desc' },
            select: { clientNumber: true },
          }),
          this.prisma.oliveEntry.findFirst({
            where: { ...base, pressingRecord: { isNot: null } },
            orderBy: { referenceNumber: 'desc' },
            select: { referenceNumber: true },
          }),
          this.clientStatsForType(seasonId, oliveType),
        ]);

        const lastClientNum = lastClient?.clientNumber ?? 0;
        const lastMilledRef = lastMilledEntry?.referenceNumber ?? 0;

        return {
          oliveType,
          label: OLIVE_TYPE_AR[oliveType],
          lastClientNumber: lastClientNum,
          lastMilledReferenceNumber: lastMilledRef,
          nextClientNumber: lastClientNum + 1,
          milledCount: clientStats.milledCount,
          unmilledCount: clientStats.unmilledCount,
          subscriptionsCount: clientStats.receptionCount,
        };
      }),
    );

    const revenueAgg = await this.prisma.pressingRecord.aggregate({
      where: { oliveEntry: { seasonId, deletedAt: null } },
      _sum: { amount: true, aidAmount: true },
    });

    const ctx = await this.seasonScope.getContext();

    return {
      season,
      readOnly: ctx.readOnly,
      activeSeason: ctx.activeSeason,
      companyName,
      pricePerQuintal,
      oliveTypes: byType,
      revenue: Number(revenueAgg._sum.amount ?? 0),
      totalAid: Number(revenueAgg._sum.aidAmount ?? 0),
    };
  }
}
