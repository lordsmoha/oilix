import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_ACTIONS, AUDIT_MODULES } from '../../common/constants/audit';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { expandPermissions } from '../../common/permissions/permission-catalog';
import {
  assertNotRateLimited,
  clearLoginAttempts,
  loginAttemptKey,
  recordFailedLogin,
  type AttemptBucket,
} from './login-rate-limit';

@Injectable()
export class AuthService {
  private readonly loginAttempts = new Map<string, AttemptBucket>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  private assertLoginAllowed(key: string) {
    try {
      assertNotRateLimited(this.loginAttempts, key);
    } catch (e) {
      if (e instanceof Error && e.message === 'LOGIN_RATE_LIMITED') {
        throw new HttpException(
          'تم تجاوز عدد محاولات تسجيل الدخول. أعد المحاولة بعد 15 دقيقة.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw e;
    }
  }

  async login(dto: LoginDto, ip?: string) {
    const key = loginAttemptKey(dto.username, ip);
    this.assertLoginAllowed(key);

    const user = await this.prisma.user.findFirst({
      where: { username: dto.username, deletedAt: null },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      recordFailedLogin(this.loginAttempts, key);
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      recordFailedLogin(this.loginAttempts, key);
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    clearLoginAttempts(this.loginAttempts, key);

    const held =
      user.permissions?.length > 0 ? user.permissions : user.role.permissions;
    const permissions = [...expandPermissions(held)];

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role.name,
      permissions: permissions as JwtPayload['permissions'],
    };

    const accessToken = await this.jwtService.signAsync(payload);

    await this.auditService.log({
      userId: user.id,
      action: AUDIT_ACTIONS.LOGIN,
      module: AUDIT_MODULES.AUTH,
      description: 'سجّل الدخول إلى النظام',
      entity: 'User',
      entityId: user.id,
      ipAddress: ip,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        roleAr: user.role.nameAr,
        permissions,
      },
    };
  }

  async logout(userId: string, username: string, ip?: string) {
    await this.auditService.log({
      userId,
      action: AUDIT_ACTIONS.LOGOUT,
      module: AUDIT_MODULES.AUTH,
      description: 'سجّل الخروج من النظام',
      entity: 'User',
      entityId: userId,
      ipAddress: ip,
    });
    return { message: 'تم تسجيل الخروج' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { role: true },
    });
    if (!user) throw new UnauthorizedException();
    if (!user.isActive) throw new UnauthorizedException();
    const held =
      user.permissions?.length > 0 ? user.permissions : user.role.permissions;
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      roleAr: user.role.nameAr,
      permissions: [...expandPermissions(held)],
    };
  }
}
