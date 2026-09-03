import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto, paginatedMeta } from '../../common/dto/pagination.dto';
import {
  AUDIT_ACTIONS,
  AUDIT_MODULES,
  PROTECTED_ADMIN_USERNAME,
} from '../../common/constants/audit';
import { users as usersAudit } from '../../common/audit/audit-format';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PERMISSION_MATRIX } from '../../common/permissions/permission-catalog';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async getUserOrThrow(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  private assertNotProtectedAdmin(user: { username: string }, action: string) {
    if (user.username === PROTECTED_ADMIN_USERNAME) {
      throw new ForbiddenException(
        `لا يمكن ${action} على حساب المدير الرئيسي (${PROTECTED_ADMIN_USERNAME})`,
      );
    }
  }

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { username: { contains: query.search, mode: 'insensitive' as const } },
              { firstName: { contains: query.search, mode: 'insensitive' as const } },
              { lastName: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: query.skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { role: true },
        omit: { passwordHash: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, meta: paginatedMeta(total, page, limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
      omit: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  async create(dto: CreateUserDto, actorId: string) {
    const exists = await this.prisma.user.findFirst({
      where: { username: dto.username, deletedAt: null },
    });
    if (exists) throw new ConflictException('اسم المستخدم مستخدم مسبقاً');

    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('الدور غير موجود');

    const { password, permissions, ...userData } = dto;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        permissions: (permissions?.length ? permissions : role.permissions) as never,
      },
      include: { role: true },
      omit: { passwordHash: true },
    });

    await this.auditService.log({
      userId: actorId,
      action: AUDIT_ACTIONS.CREATE,
      module: AUDIT_MODULES.USERS,
      description: usersAudit.create(user.username, role.nameAr),
      entity: 'User',
      entityId: user.id,
      newData: { username: user.username, roleId: user.roleId, isActive: user.isActive },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const existing = await this.getUserOrThrow(id);
    this.assertNotProtectedAdmin(existing, 'تعديل');

    if (dto.username && dto.username !== existing.username) {
      const taken = await this.prisma.user.findFirst({
        where: { username: dto.username, deletedAt: null, id: { not: id } },
      });
      if (taken) throw new ConflictException('اسم المستخدم مستخدم مسبقاً');
    }

    if (dto.roleId && dto.roleId !== existing.roleId) {
      const adminRole = await this.prisma.role.findUnique({ where: { name: 'ADMIN' } });
      if (existing.role.name === 'ADMIN' && adminRole && dto.roleId !== adminRole.id) {
        const adminCount = await this.prisma.user.count({
          where: { deletedAt: null, roleId: adminRole.id, isActive: true },
        });
        if (adminCount <= 1) {
          throw new BadRequestException('يجب الإبقاء على مدير نظام واحد على الأقل');
        }
      }
    }

    const passwordChanged = !!dto.password;
    const data: Record<string, unknown> = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
      delete data.password;
    }
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { role: true },
      omit: { passwordHash: true },
    });

    if (passwordChanged) {
      await this.auditService.log({
        userId: actorId,
        action: AUDIT_ACTIONS.RESET_PASSWORD,
        module: AUDIT_MODULES.USERS,
        description: usersAudit.resetPassword(user.username),
        entity: 'User',
        entityId: id,
      });
    }

    const changes: { label: string; before: string; after: string }[] = [];
    if (dto.username && dto.username !== existing.username) {
      changes.push({
        label: 'اسم المستخدم',
        before: existing.username,
        after: dto.username,
      });
    }
    if (dto.firstName !== undefined && dto.firstName !== existing.firstName) {
      changes.push({
        label: 'الاسم',
        before: existing.firstName ?? '—',
        after: dto.firstName,
      });
    }
    if (dto.lastName !== undefined && dto.lastName !== existing.lastName) {
      changes.push({
        label: 'اللقب',
        before: existing.lastName ?? '—',
        after: dto.lastName,
      });
    }
    if (dto.isActive !== undefined && dto.isActive !== existing.isActive) {
      changes.push({
        label: 'الحالة',
        before: existing.isActive ? 'نشط' : 'معطّل',
        after: dto.isActive ? 'نشط' : 'معطّل',
      });
    }

    if (dto.roleId && dto.roleId !== existing.roleId) {
      const newRole = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      await this.auditService.log({
        userId: actorId,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.USERS,
        description: usersAudit.roleChange(
          user.username,
          existing.role.nameAr,
          newRole?.nameAr ?? dto.roleId,
        ),
        entity: 'User',
        entityId: id,
        oldData: { roleId: existing.roleId, roleAr: existing.role.nameAr },
        newData: { roleId: dto.roleId, roleAr: newRole?.nameAr },
      });
    } else if (changes.length > 0) {
      await this.auditService.log({
        userId: actorId,
        action: AUDIT_ACTIONS.UPDATE,
        module: AUDIT_MODULES.USERS,
        description: usersAudit.update(user.username, changes),
        entity: 'User',
        entityId: id,
        oldData: {
          username: existing.username,
          firstName: existing.firstName,
          lastName: existing.lastName,
          isActive: existing.isActive,
        },
        newData: data as object,
      });
    }

    return user;
  }

  async setActive(id: string, isActive: boolean, actorId: string) {
    const existing = await this.getUserOrThrow(id);
    this.assertNotProtectedAdmin(existing, 'تعطيل');

    if (!isActive && existing.role.name === 'ADMIN') {
      const adminRole = await this.prisma.role.findUnique({ where: { name: 'ADMIN' } });
      if (adminRole) {
        const activeAdmins = await this.prisma.user.count({
          where: {
            deletedAt: null,
            isActive: true,
            roleId: adminRole.id,
            id: { not: id },
          },
        });
        if (activeAdmins < 1) {
          throw new BadRequestException('يجب الإبقاء على مدير نشط واحد على الأقل');
        }
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      include: { role: true },
      omit: { passwordHash: true },
    });

    await this.auditService.log({
      userId: actorId,
      action: AUDIT_ACTIONS.UPDATE,
      module: AUDIT_MODULES.USERS,
      description: isActive
        ? usersAudit.activate(user.username)
        : usersAudit.deactivate(user.username),
      entity: 'User',
      entityId: id,
      oldData: { isActive: existing.isActive },
      newData: { isActive },
    });

    return user;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.getUserOrThrow(id);
    this.assertNotProtectedAdmin(existing, 'حذف');

    if (existing.role.name === 'ADMIN') {
      const adminRole = await this.prisma.role.findUnique({ where: { name: 'ADMIN' } });
      if (adminRole) {
        const adminCount = await this.prisma.user.count({
          where: { deletedAt: null, roleId: adminRole.id },
        });
        if (adminCount <= 1) {
          throw new BadRequestException('لا يمكن حذف آخر مدير في النظام');
        }
      }
    }

    if (id === actorId) {
      throw new BadRequestException('لا يمكنك حذف حسابك أثناء الجلسة الحالية');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      userId: actorId,
      action: AUDIT_ACTIONS.DELETE,
      module: AUDIT_MODULES.USERS,
      description: usersAudit.delete(existing.username),
      entity: 'User',
      entityId: id,
      oldData: { username: existing.username, roleAr: existing.role.nameAr },
    });

    return { message: 'تم حذف المستخدم' };
  }

  async listRoles() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  permissionCatalog() {
    return PERMISSION_MATRIX;
  }
}
