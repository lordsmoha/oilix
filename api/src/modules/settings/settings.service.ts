import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

import {
  KG_PER_QUINTAL,
  pricePerQuintalFromKg,
} from '../../common/constants/pricing';
import { AUDIT_ACTIONS, AUDIT_MODULES } from '../../common/constants/audit';
import { seasons as seasonsAudit } from '../../common/audit/audit-format';
import { PURGE_CONFIRM_PHRASE } from '../../common/constants/purge';

export const SETTING_KEYS = {
  PRICE_PER_QUINTAL: 'price_per_quintal',
  /** @deprecated Ancienne clé — lecture seule pour migration */
  PRICE_PER_KG: 'price_per_kg',
  ACTIVE_SEASON_ID: 'active_season_id',
  COMPANY_NAME: 'company_name',
  COMPANY_PHONE: 'company_phone',
  COMPANY_ADDRESS: 'company_address',
} as const;

@Injectable()
export class SettingsService {
  private cache = new Map<string, unknown>();

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notifications: NotificationsService,
  ) {}

  async getAll() {
    const settings = await this.prisma.setting.findMany();
    const season = await this.prisma.season.findFirst({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
    });
    return { settings, activeSeason: season };
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    if (this.cache.has(key)) return this.cache.get(key) as T;
    const row = await this.prisma.setting.findUnique({ where: { key } });
    const value = (row?.value as T) ?? fallback;
    this.cache.set(key, value);
    return value;
  }

  async set(key: string, value: Prisma.InputJsonValue, userId: string) {
    const setting = await this.prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    this.cache.set(key, value);
    await this.auditService.log({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.SETTINGS,
      description: `تحديث إعداد: ${key}`,
      entity: 'Setting',
      entityId: key,
      newData: { value },
    });
    return setting;
  }

  async getActiveSeasonId(): Promise<string> {
    const cached = await this.get<string | null>(
      SETTING_KEYS.ACTIVE_SEASON_ID,
      null,
    );
    if (cached) return cached;

    let season = await this.prisma.season.findFirst({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
    });

    if (!season) {
      season = await this.prisma.season.create({
        data: {
          name: `موسم ${new Date().getFullYear()}`,
          startDate: new Date(new Date().getFullYear(), 0, 1),
          isActive: true,
        },
      });
    }

    await this.set(SETTING_KEYS.ACTIVE_SEASON_ID, season.id, 'system');
    return season.id;
  }

  async startNewSeason(name: string, userId: string) {
    const closing = await this.prisma.season.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    await this.prisma.season.updateMany({
      where: { isActive: true },
      data: { isActive: false, endDate: new Date() },
    });

    for (const s of closing) {
      await this.auditService.log({
        userId,
        action: AUDIT_ACTIONS.CLOSE_SEASON,
        module: AUDIT_MODULES.SEASONS,
        description: seasonsAudit.close(s.name),
        entity: 'Season',
        entityId: s.id,
      });
    }

    const season = await this.prisma.season.create({
      data: { name, startDate: new Date(), isActive: true },
    });
    this.cache.delete(SETTING_KEYS.ACTIVE_SEASON_ID);
    await this.set(SETTING_KEYS.ACTIVE_SEASON_ID, season.id, userId);
    await this.auditService.log({
      userId,
      action: AUDIT_ACTIONS.NEW_SEASON,
      module: AUDIT_MODULES.SEASONS,
      description: seasonsAudit.create(name),
      entity: 'Season',
      entityId: season.id,
      newData: { name },
    });

    const actorName = await this.auditService.getActorDisplayName(userId);
    await this.notifications.notifyNewSeason({
      seasonName: name,
      actorName,
      actorId: userId,
      seasonId: season.id,
    });

    return season;
  }

  async logSeasonArchiveView(seasonId: string, userId: string) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('الموسم غير موجود');
    const activeId = await this.getActiveSeasonId();
    if (seasonId === activeId) return { logged: false };

    await this.auditService.log({
      userId,
      action: AUDIT_ACTIONS.VIEW_ARCHIVE,
      module: AUDIT_MODULES.SEASONS,
      description: seasonsAudit.viewArchive(season.name),
      entity: 'Season',
      entityId: seasonId,
    });
    return { logged: true };
  }

  async getPricePerQuintal(): Promise<number> {
    const stored = await this.get<number | null>(SETTING_KEYS.PRICE_PER_QUINTAL, null);
    if (stored != null && stored > 0) return stored;
    const legacyKg = await this.get<number>(SETTING_KEYS.PRICE_PER_KG, 0);
    return pricePerQuintalFromKg(legacyKg);
  }

  async getPricePerKg(): Promise<number> {
    return (await this.getPricePerQuintal()) / KG_PER_QUINTAL;
  }

  async listSeasons() {
    const activeId = await this.getActiveSeasonId();
    const seasons = await this.prisma.season.findMany({
      orderBy: { startDate: 'desc' },
    });
    const [entryCounts, clientCounts] = await Promise.all([
      this.prisma.oliveEntry.groupBy({
        by: ['seasonId'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.client.groupBy({
        by: ['seasonId'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
    ]);
    const entryMap = new Map(entryCounts.map((c) => [c.seasonId, c._count._all]));
    const clientMap = new Map(clientCounts.map((c) => [c.seasonId, c._count._all]));

    return seasons.map((s) => ({
      id: s.id,
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      isActive: s.id === activeId,
      entryCount: entryMap.get(s.id) ?? 0,
      clientCount: clientMap.get(s.id) ?? 0,
    }));
  }

  /**
   * Supprime toutes les données applicatives et réinitialise un موسم vide.
   * Conserve les rôles, réglages du pressoir, appareils, caisses, contenants,
   * et les utilisateurs ADMIN uniquement.
   */
  async purgeDatabase(
    actorId: string,
    actorRole: string,
    confirmPhrase: string,
  ) {
    if (actorRole !== 'ADMIN') {
      throw new ForbiddenException(
        'هذا الإجراء مخصص لحساب المدير الرئيسي فقط',
      );
    }
    if (confirmPhrase.trim() !== PURGE_CONFIRM_PHRASE) {
      throw new BadRequestException(
        `يجب كتابة "${PURGE_CONFIRM_PHRASE}" للتأكيد`,
      );
    }

    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });
    if (!adminRole) {
      throw new NotFoundException('دور المدير غير موجود');
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        // Oil sales / stock first (FK → Season, User, OilSale, …)
        const oilSaleItems = (await tx.oilSaleItem.deleteMany()).count;
        const oilContainerMovements = (
          await tx.oilContainerStockMovement.deleteMany()
        ).count;
        const oilStockMovements = (await tx.oilStockMovement.deleteMany()).count;
        const oilContainerCounts = (
          await tx.oilContainerInventoryCount.deleteMany()
        ).count;
        const oilInventoryCounts = (await tx.oilInventoryCount.deleteMany())
          .count;
        const oilSales = (await tx.oilSale.deleteMany()).count;
        const oilSaleCustomers = (await tx.oilSaleCustomer.deleteMany()).count;
        const oilContainerBalances = (
          await tx.oilContainerStockBalance.deleteMany()
        ).count;
        const oilStockBalances = (await tx.oilStockBalance.deleteMany()).count;
        const cashSessions = (await tx.cashRegisterSession.deleteMany()).count;

        // Mill operational data
        const payments = (await tx.payment.deleteMany()).count;
        const pressingRecords = (await tx.pressingRecord.deleteMany()).count;
        const filtrationRecords = (await tx.filtrationRecord.deleteMany())
          .count;
        const entryWeights = (await tx.entryWeight.deleteMany()).count;
        const oliveEntries = (await tx.oliveEntry.deleteMany()).count;
        const clients = (await tx.client.deleteMany()).count;

        const notifications = (await tx.notification.deleteMany()).count;
        const reportSnapshots = (await tx.reportSnapshot.deleteMany()).count;
        const auditLogs = (await tx.auditLog.deleteMany()).count;
        const seasons = (await tx.season.deleteMany()).count;
        const users = (
          await tx.user.deleteMany({
            where: { roleId: { not: adminRole.id } },
          })
        ).count;

        const deleted = {
          oilSaleItems,
          oilContainerMovements,
          oilStockMovements,
          oilContainerCounts,
          oilInventoryCounts,
          oilSales,
          oilSaleCustomers,
          oilContainerBalances,
          oilStockBalances,
          cashSessions,
          payments,
          pressingRecords,
          filtrationRecords,
          entryWeights,
          oliveEntries,
          clients,
          notifications,
          reportSnapshots,
          auditLogs,
          seasons,
          users,
        };

        const season = await tx.season.create({
          data: {
            name: `موسم ${new Date().getFullYear()}`,
            startDate: new Date(),
            isActive: true,
          },
        });

        await tx.setting.upsert({
          where: { key: SETTING_KEYS.ACTIVE_SEASON_ID },
          create: { key: SETTING_KEYS.ACTIVE_SEASON_ID, value: season.id },
          update: { value: season.id },
        });

        const defaultQuintal = await tx.setting.findUnique({
          where: { key: SETTING_KEYS.PRICE_PER_QUINTAL },
        });
        if (!defaultQuintal) {
          await tx.setting.create({
            data: { key: SETTING_KEYS.PRICE_PER_QUINTAL, value: 250 },
          });
        }

        return { deleted, season };
      },
      { timeout: 120_000, maxWait: 20_000 },
    );

    this.cache.clear();

    await this.auditService.log({
      userId: actorId,
      action: AUDIT_ACTIONS.PURGE,
      module: AUDIT_MODULES.SYSTEM,
      description: 'تفريغ كامل لقاعدة البيانات وإعادة التهيئة',
      entity: 'System',
      entityId: 'purge',
      newData: { deleted: result.deleted, newSeasonId: result.season.id },
    });

    return {
      message: 'تم تفريغ قاعدة البيانات وإعادة التهيئة',
      deleted: result.deleted,
      activeSeason: result.season,
    };
  }
}
