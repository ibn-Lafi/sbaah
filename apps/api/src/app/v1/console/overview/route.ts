import type { NextRequest } from 'next/server';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const results = await Promise.all([
    supabase.from('tenants').select('id', { count: 'exact', head: true }),
    supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('properties').select('id', { count: 'exact', head: true }),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('websites').select('id', { count: 'exact', head: true }),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).neq('status', 'closed'),
    supabase.from('tenants').select('id,name_ar,name_en,status,created_at').order('created_at', { ascending: false }).limit(5),
  ]);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(`Failed to load console overview: ${failed.error.message}`);
  const [tenants, activeTenants, properties, projects, leads, websites, openTickets, recentAccounts] = results;
  return okResponse({
    metrics: { accounts: tenants.count ?? 0, active_accounts: activeTenants.count ?? 0, properties: properties.count ?? 0, projects: projects.count ?? 0, leads: leads.count ?? 0, websites: websites.count ?? 0, open_tickets: openTickets.count ?? 0 },
    recent_accounts: recentAccounts.data ?? [],
  });
});
