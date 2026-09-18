import {
  getLegacyPermissionGrant,
  type DataScope,
  type Permission,
  type PermissionGrant,
  type UserRole,
} from '@sbaah/shared';
import { ApiError } from '@/lib/http';

export function getPermissionGrant(role: UserRole, permission: Permission): PermissionGrant | undefined {
  return getLegacyPermissionGrant(role, permission);
}

export function assertPermission(role: UserRole, permission: Permission): PermissionGrant {
  const grant = getPermissionGrant(role, permission);
  if (!grant) {
    throw new ApiError(403, 'forbidden', 'ليس لديك صلاحية لتنفيذ هذا الإجراء');
  }
  return grant;
}

export function assertPermissionScope(
  role: UserRole,
  permission: Permission,
  allowedScopes: readonly DataScope[],
): PermissionGrant {
  const grant = assertPermission(role, permission);
  if (!allowedScopes.includes(grant.scope)) {
    throw new ApiError(403, 'forbidden_scope', 'نطاق صلاحيتك لا يسمح بتنفيذ هذا الإجراء');
  }
  return grant;
}
