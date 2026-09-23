import type { UserRole } from './enums';

export const DATA_SCOPES = ['own', 'assigned', 'team', 'organization'] as const;
export type DataScope = (typeof DATA_SCOPES)[number];

/**
 * Stable authorization vocabulary. Product code should ask for a permission,
 * while business activities decide which product modules exist for the tenant.
 */
export const PERMISSIONS = [
  'tenant.settings.read',
  'tenant.settings.manage',
  'team.read',
  'team.manage',
  'properties.read',
  'properties.create',
  'properties.update',
  'properties.publish',
  'properties.archive',
  'projects.read',
  'projects.create',
  'projects.update',
  'projects.publish',
  'projects.archive',
  'crm.read',
  'crm.create',
  'crm.update',
  'crm.assign',
  'crm.manage',
  'website.read',
  'website.manage',
  'billing.read',
  'billing.manage',
  'reports.read',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export interface PermissionGrant {
  permission: Permission;
  scope: DataScope;
}

const ORGANIZATION: DataScope = 'organization';
const ASSIGNED: DataScope = 'assigned';

const ownerPermissions: readonly Permission[] = PERMISSIONS;
const adminPermissions: readonly Permission[] = PERMISSIONS.filter(
  (permission) => permission !== 'billing.manage' && permission !== 'tenant.settings.manage',
);
const agentPermissions: readonly Permission[] = [
  // Agents can inspect inventory/project context, but asset/listing/project
  // mutation is owner/admin-only in the API and database policies.
  'properties.read',
  'projects.read',
  // CRM work is limited to records assigned to the agent.
  'crm.read',
  'crm.update',
  'reports.read',
];

/**
 * Compatibility bridge for the existing owner/admin/agent model. It is
 * intentionally centralized so endpoints can migrate away from scattered
 * role comparisons without changing stored roles yet.
 */
export const LEGACY_ROLE_PERMISSION_GRANTS: Record<UserRole, readonly PermissionGrant[]> = {
  owner: ownerPermissions.map((permission) => ({ permission, scope: ORGANIZATION })),
  admin: adminPermissions.map((permission) => ({ permission, scope: ORGANIZATION })),
  agent: agentPermissions.map((permission) => ({
    permission,
    scope: permission === 'properties.read' || permission === 'projects.read' ? ORGANIZATION : ASSIGNED,
  })),
};

export function getLegacyPermissionGrant(
  role: UserRole,
  permission: Permission,
): PermissionGrant | undefined {
  return LEGACY_ROLE_PERMISSION_GRANTS[role].find((grant) => grant.permission === permission);
}

export function legacyRoleHasPermission(role: UserRole, permission: Permission): boolean {
  return getLegacyPermissionGrant(role, permission) !== undefined;
}
