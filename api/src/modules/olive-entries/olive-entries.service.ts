import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntryStatus, OliveType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginatedMeta } from '../../common/dto/pagination.dto';
import { OLIVE_TYPE_AR } from '../../common/constants/arabic-labels';
import { AUDIT_ACTIONS, AUDIT_MODULES } from '../../common/constants/audit';
import { olive as oliveAudit } from '../../common/audit/audit-format';
import { assertNotStale } from '../../common/utils/optimistic-lock';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { REALTIME_ENTITIES } from '../realtime/realtime.constants';
import { RealtimeService } from '../realtime/realtime.service';
import { SettingsService } from '../settings/settings.service';
import { SeasonScopeService } from '../../common/season/season-scope.service';
import { ClientsService } from '../clients/clients.service';
import { CreateOliveEntryDto } from './dto/create-olive-entry.dto';
import { ClientBoardQueryDto } from './dto/client-board-query.dto';
import { OliveEntryQueryDto } from './dto/olive-entry-query.dto';
import { UpdateOliveEntryDto } from './dto/update-olive-entry.dto';
import { attributedDeviceId } from '../devices/device-context';

import { currentTimeAlgeria } from '../../common/utils/algeria-locale';

function currentTime(): string {
  return currentTimeAlgeria();
}

@Injectable()
export class OliveEntriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private settingsService: SettingsService,
    private seasonScope: SeasonScopeService,
    private clientsService: ClientsService,
    private realtime: RealtimeService,
    private notifications: NotificationsService,
  ) {}

  private clientName(client: { firstName: string; lastName: string }) {
    return `${client.firstName} ${client.lastName}`.trim();
  }

  private async broadcastEntry(
    action: string,
    entry: {
      id: string;
      seasonId: string;
      clientId: string;
      oliveType: OliveType;
      client: { firstName: string; lastName: string };
      updatedAt: Date;
    },
    userId: string,
    source: string,
    summary: string,
  ) {
    const actorName = await this.auditService.getActorDisplayName(userId);
    const clientName = this.clientName(entry.client);
    const oliveTypeAr = OLIVE_TYPE_AR[entry.oliveType];
    const src = source === 'mobile' ? 'mobile' : 'web';

    this.realtime.emit({
      entity: REALTIME_ENTITIES.OLIVE_ENTRY,
      entityId: entry.id,
      action,
      module: AUDIT_MODULES.OLIVE,
      seasonId: entry.seasonId,
      oliveType: entry.oliveType,
      oliveTypeAr,
      clientId: entry.clientId,
      entryId: entry.id,
      clientName,
      actorId: userId,
      actorName,
      source: src,
      updatedAt: entry.updatedAt.toISOString(),
    });

    if (src === 'web') {
      await this.notifications.notifyWebOliveEntry({
        action,
        clientName,
        oliveTypeAr,
        oliveType: entry.oliveType,
        actorName,
        actorId: userId,
        seasonId: entry.seasonId,
        clientId: entry.clientId,
        entryId: entry.id,
        summary,
      });
    }
  }

  private buildWhere(query: OliveEntryQueryDto): Prisma.OliveEntryWhereInput {
    return {
      deletedAt: null,
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.deviceId ? { deviceId: query.deviceId } : {}),
      ...(query.oliveType ? { oliveType: query.oliveType } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.referenceNumber
        ? { referenceNumber: query.referenceNumber }
        : {}),
      ...(query.untreatedOnly
        ? { status: { in: [EntryStatus.RECEIVED, EntryStatus.IN_STORAGE] } }
        : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            entryDate: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                client: {
                  firstName: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              {
                client: {
                  lastName: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              },
              ...(Number.isInteger(Number(query.search))
                ? [{ referenceNumber: Number(query.search) }]
                : []),
            ],
          }
        : {}),
    };
  }

  async findAll(query: OliveEntryQueryDto, userId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const seasonId = await this.seasonScope.getSeasonId();
    const where = { ...this.buildWhere(query), seasonId };

    const [items, total] = await Promise.all([
      this.prisma.oliveEntry.findMany({
        where,
        skip: query.skip,
        take: limit,
        orderBy: { referenceNumber: 'desc' },
        include: {
          client: true,
          user: { select: { id: true, username: true, firstName: true } },
          device: { select: { id: true, code: true, name: true } },
          weights: true,
          pressingRecord: true,
        },
      }),
      this.prisma.oliveEntry.count({ where }),
    ]);

    if (query.logView && query.clientId && userId) {
      const client = items[0]?.client ?? (await this.prisma.client.findFirst({
        where: { id: query.clientId, deletedAt: null },
        select: { id: true, clientNumber: true, firstName: true, lastName: true },
      }));
      if (client) {
        await this.auditService.log({
          userId,
          action: AUDIT_ACTIONS.READ,
          module: AUDIT_MODULES.OLIVE,
          description: oliveAudit.viewWeighingsDetail(client),
          entity: 'Client',
          entityId: client.id,
        });
      }
    }

    return {
      items: items.map((e) => ({
        ...e,
        oliveTypeAr: OLIVE_TYPE_AR[e.oliveType],
      })),
      meta: paginatedMeta(total, page, limit),
    };
  }

  async clientBoard(query: ClientBoardQueryDto) {
    const seasonId = await this.seasonScope.getSeasonId();
    const limit = query.limit ?? 20;
    const fetchAll = limit >= 9999;

    const where: Prisma.OliveEntryWhereInput = {
      seasonId,
      deletedAt: null,
      ...(query.oliveType ? { oliveType: query.oliveType } : {}),
      ...(query.untreatedOnly
        ? { status: { in: [EntryStatus.RECEIVED, EntryStatus.IN_STORAGE] } }
        : {}),
    };

    const groups = await this.prisma.oliveEntry.groupBy({
      by: ['clientId'],
      where,
      _sum: {
        bagCount: true,
        totalWeightKg: true,
        adhlefCount: true,
        capacity: true,
      },
      _count: { id: true },
      _max: { entryDate: true, referenceNumber: true },
      orderBy: { _max: { entryDate: 'desc' } },
      ...(fetchAll ? {} : { skip: query.skip, take: limit }),
    });

    const total = fetchAll
      ? groups.length
      : await this.prisma.oliveEntry
          .findMany({
            where,
            distinct: ['clientId'],
            select: { clientId: true },
          })
          .then((rows) => rows.length);

    const clientIds = groups.map((g) => g.clientId);
    const [clients, latestEntries] = await Promise.all([
      this.prisma.client.findMany({
        where: { id: { in: clientIds }, deletedAt: null },
        select: { id: true, clientNumber: true, firstName: true, lastName: true, phone: true, notes: true },
      }),
      Promise.all(
        clientIds.map((clientId) =>
          this.prisma.oliveEntry.findFirst({
            where: { ...where, clientId },
            orderBy: [{ entryDate: 'desc' }, { referenceNumber: 'desc' }],
            select: { id: true, clientId: true },
          }),
        ),
      ),
    ]);
    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const latestEntryMap = new Map(
      latestEntries.filter(Boolean).map((e) => [e!.clientId, e!.id]),
    );

    return {
      items: groups.map((g) => {
        const c = clientMap.get(g.clientId);
        return {
          clientId: g.clientId,
          clientNumber: c?.clientNumber ?? 0,
          firstName: c?.firstName ?? '',
          lastName: c?.lastName ?? '',
          phone: c?.phone ?? null,
          notes: c?.notes ?? null,
          bagCount: g._sum.bagCount ?? 0,
          totalWeightKg: Number(g._sum.totalWeightKg ?? 0),
          adhlefCount: g._sum.adhlefCount ?? 0,
          capacity: g._sum.capacity ? Number(g._sum.capacity) : 0,
          entryCount: g._count.id,
          latestEntryId: latestEntryMap.get(g.clientId) ?? null,
          lastEntryDate: g._max.entryDate,
          lastReferenceNumber: g._max.referenceNumber,
        };
      }),
      meta: paginatedMeta(total, query.page ?? 1, limit),
      total,
    };
  }

  async findOne(id: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    const entry = await this.prisma.oliveEntry.findFirst({
      where: { id, deletedAt: null, seasonId },
      include: {
        client: true,
        user: { select: { id: true, username: true, firstName: true } },
        weights: { orderBy: [{ weighRound: 'asc' }, { bagNumber: 'asc' }] },
        pressingRecord: { include: { payments: true } },
        season: true,
      },
    });
    if (!entry) throw new NotFoundException('عملية الاستقبال غير موجودة');
    return { ...entry, oliveTypeAr: OLIVE_TYPE_AR[entry.oliveType] };
  }

  async create(dto: CreateOliveEntryDto, userId: string, source = 'web') {
    const seasonId = await this.settingsService.getActiveSeasonId();
    await this.clientsService.assertClientInSeason(
      dto.clientId,
      seasonId,
      dto.oliveType,
    );
    const last = await this.prisma.oliveEntry.findFirst({
      where: { seasonId, oliveType: dto.oliveType },
      orderBy: { referenceNumber: 'desc' },
    });
    const referenceNumber = (last?.referenceNumber ?? 0) + 1;
    const totalWeightKg = dto.weights.reduce((s, w) => s + w.weightKg, 0);

    const entry = await this.prisma.oliveEntry.create({
      data: {
        clientId: dto.clientId,
        seasonId,
        referenceNumber,
        oliveType: dto.oliveType,
        bagCount: dto.bagCount,
        adhlefCount: dto.adhlefCount,
        capacity: dto.capacity,
        totalWeightKg,
        notes: dto.notes,
        entryTime: currentTime(),
        userId,
        deviceId: attributedDeviceId(),
        weights: {
          create: dto.weights.map((w) => ({
            bagNumber: w.bagNumber,
            weightKg: w.weightKg,
            weighRound: w.weighRound ?? 1,
          })),
        },
      },
      include: {
        client: true,
        weights: true,
        device: { select: { id: true, code: true, name: true } },
        user: { select: { id: true, username: true } },
      },
    });

    await this.auditService.log({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.OLIVE,
      description: oliveAudit.newWeighing({
        client: entry.client,
        oliveTypeAr: OLIVE_TYPE_AR[dto.oliveType],
        reference: referenceNumber,
        weightKg: totalWeightKg,
        bagCount: dto.bagCount,
        adhlefCount: dto.adhlefCount,
        capacity: dto.capacity,
      }),
      entity: 'OliveEntry',
      entityId: entry.id,
      newData: {
        referenceNumber,
        clientId: dto.clientId,
        totalWeightKg,
        bagCount: dto.bagCount,
        adhlefCount: dto.adhlefCount,
      },
      source,
    });

    await this.broadcastEntry(
      AUDIT_ACTIONS.CREATE,
      entry,
      userId,
      source,
      'وزنة جديدة',
    );

    return { ...entry, oliveTypeAr: OLIVE_TYPE_AR[entry.oliveType] };
  }

  async update(
    id: string,
    dto: UpdateOliveEntryDto,
    userId: string,
    source = 'web',
  ) {
    const entry = await this.findOne(id);
    try {
      assertNotStale(entry.updatedAt, dto.expectedUpdatedAt);
    } catch (e) {
      if (e instanceof ConflictException) {
        this.realtime.emitConflict(
          REALTIME_ENTITIES.OLIVE_ENTRY,
          id,
          entry.updatedAt,
          entry.seasonId,
        );
      }
      throw e;
    }
    const changes: { label: string; before: string; after: string }[] = [];
    const fmt = (v: unknown) => String(v ?? '—');

    if (dto.bagCount !== undefined && dto.bagCount !== entry.bagCount) {
      changes.push({
        label: 'الأكياس',
        before: fmt(entry.bagCount),
        after: fmt(dto.bagCount),
      });
    }
    if (dto.adhlefCount !== undefined && dto.adhlefCount !== entry.adhlefCount) {
      changes.push({
        label: 'الضلف',
        before: fmt(entry.adhlefCount),
        after: fmt(dto.adhlefCount),
      });
    }
    if (
      dto.capacity !== undefined &&
      Number(dto.capacity) !== Number(entry.capacity ?? 0)
    ) {
      changes.push({
        label: 'السعة',
        before: fmt(entry.capacity),
        after: fmt(dto.capacity),
      });
    }
    const prevWeight = Number(entry.totalWeightKg);
    if (dto.weightKg !== undefined && dto.weightKg !== prevWeight) {
      changes.push({
        label: 'الوزن',
        before: `${fmt(prevWeight)} كغ`,
        after: `${fmt(dto.weightKg)} كغ`,
      });
    }

    const { expectedUpdatedAt: _expected, ...dtoFields } = dto;
    const data: Record<string, unknown> = {};
    if (dtoFields.bagCount !== undefined) data.bagCount = dtoFields.bagCount;
    if (dtoFields.adhlefCount !== undefined) data.adhlefCount = dtoFields.adhlefCount;
    if (dtoFields.capacity !== undefined) data.capacity = dtoFields.capacity;
    if (dtoFields.weightKg !== undefined) data.totalWeightKg = dtoFields.weightKg;

    const updated = await this.prisma.oliveEntry.update({
      where: { id },
      data,
      include: { client: true, weights: true },
    });

    if (changes.length) {
      await this.auditService.log({
        userId,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.OLIVE,
        description: oliveAudit.updateWeighing({
          client: entry.client,
          reference: entry.referenceNumber,
          oliveTypeAr: OLIVE_TYPE_AR[entry.oliveType],
          changes,
        }),
        entity: 'OliveEntry',
        entityId: id,
        oldData: {
          bagCount: entry.bagCount,
          adhlefCount: entry.adhlefCount,
          capacity: entry.capacity ? Number(entry.capacity) : null,
          totalWeightKg: prevWeight,
        },
        newData: dto as object,
        source,
      });
    }

    if (changes.length) {
      await this.broadcastEntry(
        AUDIT_ACTIONS.UPDATE,
        { ...updated, clientId: entry.clientId },
        userId,
        source,
        'تعديل الوزن أو الأكياس',
      );
    }

    return { ...updated, oliveTypeAr: OLIVE_TYPE_AR[updated.oliveType] };
  }

  async remove(id: string, userId: string) {
    const entry = await this.findOne(id);
    await this.prisma.oliveEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.auditService.log({
      userId,
      action: AUDIT_ACTIONS.DELETE,
      module: AUDIT_MODULES.OLIVE,
      description: oliveAudit.deleteWeighing({
        client: entry.client,
        reference: entry.referenceNumber,
        oliveTypeAr: OLIVE_TYPE_AR[entry.oliveType],
      }),
      entity: 'OliveEntry',
      entityId: id,
      oldData: {
        referenceNumber: entry.referenceNumber,
        totalWeightKg: Number(entry.totalWeightKg),
        bagCount: entry.bagCount,
        adhlefCount: entry.adhlefCount,
      },
    });
    await this.broadcastEntry(
      AUDIT_ACTIONS.DELETE,
      { ...entry, clientId: entry.clientId },
      userId,
      'web',
      'حذف عملية استقبال',
    );
    return { message: 'تم حذف عملية الاستقبال' };
  }

  async nextReference(oliveType?: OliveType) {
    const seasonId = await this.settingsService.getActiveSeasonId();
    const last = await this.prisma.oliveEntry.findFirst({
      where: {
        seasonId,
        deletedAt: null,
        ...(oliveType ? { oliveType } : {}),
      },
      orderBy: { referenceNumber: 'desc' },
    });
    return { nextReferenceNumber: (last?.referenceNumber ?? 0) + 1, oliveType };
  }
}
