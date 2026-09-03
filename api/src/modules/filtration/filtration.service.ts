import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OliveType, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS, AUDIT_MODULES } from '../../common/constants/audit';
import { SeasonScopeService } from '../../common/season/season-scope.service';
import { PrismaService } from '../../prisma/prisma.service';
import { REALTIME_ENTITIES } from '../realtime/realtime.constants';
import { RealtimeService } from '../realtime/realtime.service';
import {
  CreateFiltrationDto,
  FiltrationQueryDto,
  UpdateFiltrationDto,
} from './dto/filtration.dto';
import { attributedDeviceId } from '../devices/device-context';

@Injectable()
export class FiltrationService {
  constructor(
    private prisma: PrismaService,
    private seasonScope: SeasonScopeService,
    private audit: AuditService,
    private realtime: RealtimeService,
  ) {}

  private userSelect = {
    id: true,
    username: true,
    firstName: true,
    lastName: true,
  } as const;

  async nextReference(oliveType: OliveType = OliveType.GREEN) {
    const seasonId = await this.seasonScope.getSeasonId();
    const last = await this.prisma.filtrationRecord.findFirst({
      where: { seasonId, oliveType, deletedAt: null },
      orderBy: { referenceNumber: 'desc' },
      select: { referenceNumber: true },
    });
    return { next: (last?.referenceNumber ?? 0) + 1, seasonId, oliveType };
  }

  async findAll(query: FiltrationQueryDto) {
    const seasonId = await this.seasonScope.getSeasonId();
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(200, Math.max(1, query.limit ?? 50));
    const where: Prisma.FiltrationRecordWhereInput = {
      seasonId,
      deletedAt: null,
    };

    if (query.oliveType) where.oliveType = query.oliveType;
    if (query.zayatName?.trim()) {
      where.zayatName = { contains: query.zayatName.trim(), mode: 'insensitive' };
    }
    if (query.region?.trim()) {
      where.region = { contains: query.region.trim(), mode: 'insensitive' };
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      const asNum = Number(q);
      where.OR = [
        { zayatName: { contains: q, mode: 'insensitive' } },
        { region: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        ...(Number.isFinite(asNum) ? [{ referenceNumber: asNum }] : []),
      ];
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(`${query.from}T00:00:00`);
      if (query.to) where.createdAt.lte = new Date(`${query.to}T23:59:59.999`);
    }

    const [items, total] = await Promise.all([
      this.prisma.filtrationRecord.findMany({
        where,
        include: {
          createdBy: { select: this.userSelect },
          updatedBy: { select: this.userSelect },
        },
        orderBy: [{ createdAt: 'desc' }, { referenceNumber: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.filtrationRecord.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async findOne(id: string) {
    const seasonId = await this.seasonScope.getSeasonId();
    const row = await this.prisma.filtrationRecord.findFirst({
      where: { id, seasonId, deletedAt: null },
      include: {
        createdBy: { select: this.userSelect },
        updatedBy: { select: this.userSelect },
      },
    });
    if (!row) throw new NotFoundException('سجل التصفية غير موجود');
    return row;
  }

  async findByReference(referenceNumber: number, oliveType: OliveType) {
    const seasonId = await this.seasonScope.getSeasonId();
    const row = await this.prisma.filtrationRecord.findFirst({
      where: { seasonId, oliveType, referenceNumber, deletedAt: null },
      include: {
        createdBy: { select: this.userSelect },
        updatedBy: { select: this.userSelect },
      },
    });
    if (!row) throw new NotFoundException('لا يوجد سجل بهذا الرقم');
    return row;
  }

  async create(dto: CreateFiltrationDto, userId: string) {
    const zayatName = dto.zayatName.trim();
    if (zayatName.length < 2) {
      throw new BadRequestException('اسم الزيات مطلوب');
    }
    if (!(dto.quantityL > 0)) {
      throw new BadRequestException('الكمية يجب أن تكون أكبر من صفر');
    }

    const seasonId = await this.seasonScope.getSeasonId();
    const oliveType = dto.oliveType;
    let referenceNumber = dto.referenceNumber;
    if (!referenceNumber) {
      referenceNumber = (await this.nextReference(oliveType)).next;
    } else {
      const exists = await this.prisma.filtrationRecord.findFirst({
        where: { seasonId, oliveType, referenceNumber, deletedAt: null },
      });
      if (exists) {
        throw new BadRequestException('رقم العملية مستخدم مسبقاً لهذا النوع');
      }
    }

    const row = await this.prisma.filtrationRecord.create({
      data: {
        seasonId,
        oliveType,
        referenceNumber,
        zayatName,
        region: (dto.region ?? '').trim(),
        quantityL: dto.quantityL,
        khallaf: dto.khallaf ?? 0,
        notes: dto.notes?.trim() || null,
        createdById: userId,
        updatedById: userId,
        deviceId: attributedDeviceId(),
      },
      include: {
        createdBy: { select: this.userSelect },
        updatedBy: { select: this.userSelect },
      },
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.FILTRATION,
      entity: 'FiltrationRecord',
      entityId: row.id,
      description: `تسجيل تصفية #${row.referenceNumber} (${row.oliveType}) — ${row.zayatName}`,
      newData: row,
      source: 'mobile',
    });

    this.realtime.emit({
      entity: REALTIME_ENTITIES.FILTRATION,
      entityId: row.id,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.FILTRATION,
      seasonId,
      oliveType,
      actorId: userId,
      source: 'mobile',
    });

    return row;
  }

  async update(id: string, dto: UpdateFiltrationDto, userId: string) {
    const existing = await this.findOne(id);

    if (dto.zayatName !== undefined && dto.zayatName.trim().length < 2) {
      throw new BadRequestException('اسم الزيات مطلوب');
    }
    if (dto.quantityL !== undefined && !(dto.quantityL > 0)) {
      throw new BadRequestException('الكمية يجب أن تكون أكبر من صفر');
    }

    const nextType = dto.oliveType ?? existing.oliveType;
    const nextRef = dto.referenceNumber ?? existing.referenceNumber;

    if (nextType !== existing.oliveType || nextRef !== existing.referenceNumber) {
      const clash = await this.prisma.filtrationRecord.findFirst({
        where: {
          seasonId: existing.seasonId,
          oliveType: nextType,
          referenceNumber: nextRef,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (clash) throw new BadRequestException('رقم العملية مستخدم مسبقاً لهذا النوع');
    }

    const row = await this.prisma.filtrationRecord.update({
      where: { id },
      data: {
        ...(dto.oliveType !== undefined ? { oliveType: dto.oliveType } : {}),
        ...(dto.referenceNumber !== undefined
          ? { referenceNumber: dto.referenceNumber }
          : {}),
        ...(dto.zayatName !== undefined ? { zayatName: dto.zayatName.trim() } : {}),
        ...(dto.region !== undefined ? { region: dto.region.trim() } : {}),
        ...(dto.quantityL !== undefined ? { quantityL: dto.quantityL } : {}),
        ...(dto.khallaf !== undefined ? { khallaf: dto.khallaf } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
        updatedById: userId,
        ...(attributedDeviceId() ? { deviceId: attributedDeviceId() } : {}),
      },
      include: {
        createdBy: { select: this.userSelect },
        updatedBy: { select: this.userSelect },
      },
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.FILTRATION,
      entity: 'FiltrationRecord',
      entityId: row.id,
      description: `تعديل تصفية #${row.referenceNumber} (${row.oliveType})`,
      oldData: existing,
      newData: row,
      source: 'mobile',
    });

    this.realtime.emit({
      entity: REALTIME_ENTITIES.FILTRATION,
      entityId: row.id,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.FILTRATION,
      seasonId: row.seasonId,
      oliveType: row.oliveType,
      actorId: userId,
      source: 'mobile',
    });

    return row;
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id);
    await this.prisma.filtrationRecord.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });

    await this.audit.log({
      userId,
      action: AUDIT_ACTIONS.DELETE,
      module: AUDIT_MODULES.FILTRATION,
      entity: 'FiltrationRecord',
      entityId: id,
      description: `حذف تصفية #${existing.referenceNumber}`,
      oldData: existing,
      source: 'mobile',
    });

    this.realtime.emit({
      entity: REALTIME_ENTITIES.FILTRATION,
      entityId: id,
      action: AUDIT_ACTIONS.DELETE,
      module: AUDIT_MODULES.FILTRATION,
      seasonId: existing.seasonId,
      oliveType: existing.oliveType,
      actorId: userId,
      source: 'mobile',
    });

    return { ok: true };
  }
}
