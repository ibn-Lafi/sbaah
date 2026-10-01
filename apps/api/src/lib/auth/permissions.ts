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


/** Runtime permission check for the signed-in user. Unlike the legacy role
 * bridge above, this reads the explicit per-user RBAC grants through the
 * database helper and is the preferred path for migrated endpoints. */
export async function requireUserPermission(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message: string } | null }> },
  permission: Permission,
  legacy?: Permission,
): Promise<void> {
  const result = await supabase.rpc('auth_has_permission', { check_permission: permission });
  if (result.error) throw new Error('Failed to check permission: ' + result.error.message);
  if (result.data) return;
  if (legacy) {
    const fallback = await supabase.rpc('auth_has_permission', { check_permission: legacy });
    if (fallback.error) throw new Error('Failed to check legacy permission: ' + fallback.error.message);
    if (fallback.data) return;
  }
  throw new ApiError(403, 'forbidden', 'ليس لديك صلاحية لتنفيذ هذا الإجراء');
}
