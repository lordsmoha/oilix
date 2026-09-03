import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '@prisma/client';
import {
  PERMISSIONS_ANY_KEY,
  PERMISSIONS_KEY,
} from '../decorators/permissions.decorator';
import type { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { hasPermission } from '../permissions/permission-catalog';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAny = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_ANY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAny?.length && !required?.length) return true;

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();

    if (requiredAny?.length) {
      const ok = requiredAny.some((p) =>
        hasPermission(user.permissions, p, user.role),
      );
      if (!ok) {
        throw new ForbiddenException('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      }
    }

    if (required?.length) {
      const hasAll = required.every((p) =>
        hasPermission(user.permissions, p, user.role),
      );
      if (!hasAll) {
        throw new ForbiddenException('ليس لديك صلاحية لتنفيذ هذا الإجراء');
      }
    }

    return true;
  }
}
