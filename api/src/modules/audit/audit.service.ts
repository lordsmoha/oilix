import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginatedMeta } from '../../common/dto/pagination.dto';
import { actorPrefix } from '../../common/audit/audit-format';
import type { AuditModule } from '../../common/constants/audit';
import { currentDevice, currentWorkspaceHint } from '../devices/device-context';
import { AuditQueryDto } from './dto/audit-query.dto';

export type AuditLogInput = {
  userId?: string;
  action: string;
  module: AuditModule | string;
  /** جملة عربية كاملة (بدون اسم المستخدم — يُضاف تلقائياً) */
  description: string;
  entity: string;
  entityId?: string;
  oldData?: Prisma.InputJsonValue;
  newData?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  /** إذا false لا يُضاف اسم المستخدم في بداية الوصف */
  skipActorPrefix?: boolean;
};

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  private async resolveActorName(userId?: string): Promise<string> {
    if (!userId) return 'النظام';
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, firstName: true, lastName: true },
    });
    if (!user) return 'مستخدم';
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return full || user.username;
  }

  async getActorDisplayName(userId?: string): Promise<string> {
    return this.resolveActorName(userId);
  }

  async log(data: AuditLogInput) {
    const actor = await this.resolveActorName(data.userId);
    const description = data.skipActorPrefix
      ? data.description
      : actorPrefix(actor, data.description);

    const device = currentDevice();
    const workspace = currentWorkspaceHint();

    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        deviceId: device?.id ?? null,
        workspace: workspace,
        deviceCode: device?.code ?? null,
        action: data.action,
        module: data.module,
        description,
        entity: data.entity,
        entityId: data.entityId,
        oldData: data.oldData,
        newData: data.newData,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        source: data.source ?? 'web',
      },
    });
  }

  async findAll(query: AuditQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Prisma.AuditLogWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.deviceId ? { deviceId: query.deviceId } : {}),
      ...(query.workspace ? { workspace: query.workspace } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.module ? { module: query.module } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo
                ? { lte: new Date(`${query.dateTo}T23:59:59.999Z`) }
                : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: 'insensitive' as const } },
              { action: { contains: query.search, mode: 'insensitive' } },
              { entity: { contains: query.search, mode: 'insensitive' } },
              {
                user: {
                  username: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: query.skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              role: { select: { nameAr: true } },
            },
          },
          device: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, meta: paginatedMeta(total, page, limit) };
  }

  async listFilterOptions() {
    const [actions, modules, users, devices] = await Promise.all([
      this.prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        distinct: ['module'],
        select: { module: true },
        orderBy: { module: 'asc' },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, username: true, firstName: true, lastName: true },
        orderBy: { username: 'asc' },
      }),
      this.prisma.device.findMany({
        where: { code: { not: null } },
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
        take: 200,
      }),
    ]);
    return {
      actions: actions.map((a) => a.action),
      modules: modules.map((m) => m.module),
      users,
      devices,
    };
  }
}
