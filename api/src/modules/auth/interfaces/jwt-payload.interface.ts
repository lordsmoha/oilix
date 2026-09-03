import { Permission } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  permissions: Permission[];
}
