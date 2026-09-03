import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginatedMeta } from '../../common/dto/pagination.dto';
import { AUDIT_ACTIONS, AUDIT_MODULES } from '../../common/constants/audit';
import { clientFieldChanges, clients as clientsAudit } from '../../common/audit/audit-format';
import { assertNotStale } from '../../common/utils/optimistic-lock';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { REALTIME_ENTITIES } from '../realtime/realtime.constants';
import { RealtimeService } from '../realtime/realtime.service';
import { SeasonScopeService } from '../../common/season/season-scope.service';
import { SettingsService } from '../settings/settings.service';
import { OliveType } from '@prisma/client';
import { ClientsQueryDto } from './dto/clients-query.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { attributedDeviceId } from '../devices/device-context';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private seasonScope: SeasonScopeService,
    private settingsService: SettingsService,
    private realtime: RealtimeService,
    private notifications: NotificationsService,
  ) {}

  private clientName(client: { firstName: string; lastName: string }) {
    return `${client.firstName} ${client.lastName}`.trim();
  }

  private async broadcastClient(
    action: string,
    client: {
      id: string;
      seasonId: string;
      firstName: string;
      lastName: string;
      updatedAt: Date;
    },
    actorId: string,
    source: string,
  ) {
    const actorName = await this.auditService.getActorDisplayName(actorId);
    const name = this.clientName(client);
    const src = source === 'mobile' ? 'mobile' : 'web';

    this.realtime.emit({
      entity: REALTIME_ENTITIES.CLIENT,
      entityId: client.id,
      action,
      module: AUDIT_MODULES.CLIENTS,
      seasonId: client.seasonId,
      clientId: client.id,
      clientName: name,
      actorId,
      actorName,
      source: src,
      updatedAt: client.updatedAt.toISOString(),
    });

    if (src === 'web') {
      await this.notifications.notifyWebClient({
        action: action as 'CREATE' | 'UPDATE' | 'DELETE',
        clientName: name,
        actorName,
        actorId,
        seasonId: client.seasonId,
        clientId: client.id,
      });
    }
  }

  private async nextClientNumber(
    seasonId: string,
    oliveType: OliveType,
  ): Promise<number> {
    const last = await this.prisma.client.findFirst({
      where: { seasonId, oliveType, deletedAt: null },
      orderBy: { clientNumber: 'desc' },
      select: { clientNumber: true },
    });
    return (last?.clientNumber ?? 0) + 1;
  }

  async findAll(query: ClientsQueryDto) {
    const seasonId = await this.seasonScope.getSeasonId();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      seasonId,
      deletedAt: null,
      ...(query.oliveType ? { oliveType: query.oliveType } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' as const } },
              { lastName: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search, mode: 'insensitive' as const } },
              ...(Number.isInteger(Number(query.search))
                ? [{ clientNumber: Number(query.search) }]
                : []),
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip: query.skip,
        take: limit,
        orderBy: { clientNumber: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { items, meta: paginatedMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    const client = await this.prisma.client.findFirst({
      where: { id, seasonId, deletedAt: null },
      include: {
        oliveEntries: {
          where: { deletedAt: null, seasonId },
          orderBy: { entryDate: 'desc' },
          take: 10,
          include: { pressingRecord: true },
        },
      },
    });
    if (!client) throw new NotFoundException('الزبون غير موجود');
    return client;
  }

  async create(dto: CreateClientDto, actorId: string, source = 'web') {
    const seasonId = await this.settingsService.getActiveSeasonId();
    if (await this.seasonScope.isReadOnly()) {
      throw new BadRequestException('لا يمكن إضافة زبون في موسم أرشيفي');
    }

    const clientNumber = await this.nextClientNumber(seasonId, dto.oliveType);
    const client = await this.prisma.client.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone?.trim() || null,
        notes: dto.notes?.trim() || null,
        seasonId,
        oliveType: dto.oliveType,
        clientNumber,
        deviceId: attributedDeviceId(),
      },
    });
    await this.auditService.log({
      userId: actorId,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.CLIENTS,
      description: clientsAudit.create(client),
      entity: 'Client',
      entityId: client.id,
      newData: { ...dto, seasonId, clientNumber, oliveType: dto.oliveType } as object,
      source,
    });
    await this.broadcastClient(AUDIT_ACTIONS.CREATE, client, actorId, source);
    return client;
  }

  async update(id: string, dto: UpdateClientDto, actorId: string, source = 'web') {
    const before = await this.findOne(id);
    try {
      assertNotStale(before.updatedAt, dto.expectedUpdatedAt);
    } catch (e) {
      if (e instanceof ConflictException) {
        this.realtime.emitConflict(
          REALTIME_ENTITIES.CLIENT,
          id,
          before.updatedAt,
          before.seasonId,
        );
      }
      throw e;
    }

    const { expectedUpdatedAt: _expected, ...raw } = dto;
    const data: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      notes?: string | null;
      oliveType?: OliveType;
      clientNumber?: number;
    } = {};

    if (raw.firstName !== undefined) data.firstName = raw.firstName;
    if (raw.lastName !== undefined) data.lastName = raw.lastName;
    if (raw.notes !== undefined) data.notes = raw.notes || null;
    if (raw.phone !== undefined) data.phone = raw.phone?.trim() || null;

    if (raw.oliveType !== undefined && raw.oliveType !== before.oliveType) {
      const entryCount = await this.prisma.oliveEntry.count({
        where: { clientId: id, deletedAt: null },
      });
      if (entryCount > 0) {
        throw new BadRequestException(
          'لا يمكن تغيير نوع الزيتون بعد تسجيل أوزان',
        );
      }
      data.oliveType = raw.oliveType;
      data.clientNumber = await this.nextClientNumber(
        before.seasonId,
        raw.oliveType,
      );
    }

    const client = await this.prisma.client.update({ where: { id }, data });
    const changes = clientFieldChanges(before, {
      ...dto,
      ...(data.oliveType ? { oliveType: data.oliveType } : {}),
    });
    await this.auditService.log({
      userId: actorId,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.CLIENTS,
      description: clientsAudit.update(client, changes),
      entity: 'Client',
      entityId: id,
      oldData: {
        firstName: before.firstName,
        lastName: before.lastName,
        phone: before.phone,
        notes: before.notes,
        oliveType: before.oliveType,
      },
      newData: data as object,
      source,
    });
    await this.broadcastClient(AUDIT_ACTIONS.UPDATE, client, actorId, source);
    return client;
  }

  async remove(id: string, actorId: string) {
    const client = await this.findOne(id);
    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.auditService.log({
      userId: actorId,
      action: AUDIT_ACTIONS.DELETE,
      module: AUDIT_MODULES.CLIENTS,
      description: clientsAudit.delete(client),
      entity: 'Client',
      entityId: id,
      oldData: {
        clientNumber: client.clientNumber,
        firstName: client.firstName,
        lastName: client.lastName,
      },
    });
    await this.broadcastClient(AUDIT_ACTIONS.DELETE, client, actorId, 'web');
    return { message: 'تم حذف الزبون' };
  }

  /** Ensures the client belongs to the given season (used when creating olive entries). */
  async assertClientInSeason(
    clientId: string,
    seasonId: string,
    oliveType?: OliveType,
  ) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        seasonId,
        deletedAt: null,
        ...(oliveType ? { oliveType } : {}),
      },
    });
    if (!client) {
      throw new BadRequestException(
        oliveType
          ? 'هذا الزبون غير مسجّل لهذا النوع من الزيتون — أضفه من جديد'
          : 'هذا الزبون غير مسجّل في الموسم الحالي — أضفه من جديد لهذا الموسم',
      );
    }
    return client;
  }
}
