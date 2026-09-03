import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { expandPermissions } from '../../../common/permissions/permission-catalog';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true, deletedAt: null },
      include: { role: true },
    });
    if (!user) {
      throw new UnauthorizedException('انتهت الجلسة أو الحساب غير نشط');
    }
    const held =
      user.permissions?.length > 0 ? user.permissions : user.role.permissions;
    return {
      sub: user.id,
      username: user.username,
      role: user.role.name,
      permissions: [...expandPermissions(held)] as JwtPayload['permissions'],
    };
  }
}
