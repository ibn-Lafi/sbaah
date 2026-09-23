import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/http';
import { isAssignedScope } from './crm-scope';
import { assertPermission, getPermissionGrant } from './permissions';

describe('role permission matrix', () => {
  it('scopes agents to assigned CRM records and keeps them out of management actions', () => {
    const read = getPermissionGrant('agent', 'crm.read');
    expect(read && isAssignedScope(read)).toBe(true);
    expect(getPermissionGrant('agent', 'properties.read')?.scope).toBe('organization');
    for (const permission of ['team.manage', 'website.manage', 'billing.manage', 'properties.create', 'crm.manage'] as const) {
      expect(() => assertPermission('agent', permission)).toThrow(ApiError);
    }
  });

  it('gives admins everything except billing and tenant settings management', () => {
    expect(getPermissionGrant('admin', 'crm.read')?.scope).toBe('organization');
    expect(() => assertPermission('admin', 'billing.manage')).toThrow(ApiError);
    expect(() => assertPermission('admin', 'tenant.settings.manage')).toThrow(ApiError);
    expect(assertPermission('owner', 'billing.manage').scope).toBe('organization');
  });
});
