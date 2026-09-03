import { SetMetadata } from '@nestjs/common';
import { Permission } from '@prisma/client';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_ANY_KEY = 'permissions_any';

/** Require ALL listed permissions (AND). */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/** Require ANY of the listed permissions (OR). */
export const RequireAnyPermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_ANY_KEY, permissions);
