import type { NextRequest } from 'next/server';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const results = await Promise.all([
    supabase.from('properties').select('id', { count:'exact', head:true }),
    supabase.from('properties').select('id', { count:'exact', head:true }).gte('created_at', since),
    supabase.from('projects').select('id', { count:'exact', head:true }),
    supabase.from('projects').select('id', { count:'exact', head:true }).gte('created_at', since),
    supabase.from('leads').select('id', { count:'exact', head:true }),
    supabase.from('leads').select('id', { count:'exact', head:true }).gte('created_at', since),
    supabase.from('websites').select('id', { count:'exact', head:true }),
    supabase.from('tenants').select('id', { count:'exact', head:true }).eq('custom_domain_status','verified'),
    supabase.from('support_tickets').select('id', { count:'exact', head:true }),
    supabase.from('support_tickets').select('id', { count:'exact', head:true }).neq('status','closed'),
    supabase.from('tenants').select('id,name_ar,status,created_at').order('created_at',{ascending:false}).limit(8),
  ]);
  const failed=results.find(r=>r.error); if(failed?.error) throw new Error(`Failed to load operations: ${failed.error.message}`);
  const [properties,newProperties,projects,newProjects,leads,newLeads,websites,verifiedDomains,tickets,openTickets,recentAccounts]=results;
  return okResponse({
    totals:{properties:properties.count??0,projects:projects.count??0,leads:leads.count??0,websites:websites.count??0,verified_domains:verifiedDomains.count??0,tickets:tickets.count??0,open_tickets:openTickets.count??0},
    last_30_days:{properties:newProperties.count??0,projects:newProjects.count??0,leads:newLeads.count??0},
    recent_accounts:recentAccounts.data??[],
  });
});
