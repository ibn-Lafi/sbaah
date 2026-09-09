import type { NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { createServiceRoleClient, type Lead } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getSndrClient } from '@/lib/sndr/client';
import { groupEligibleLeadsByAgent } from '@/lib/digest/group-overdue-leads';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * PRODUCT_SPEC section 11 / task 41/42 — called once daily by a Supabase
 * `pg_cron` + `pg_net` job (supabase/migrations/0020_daily_digest_cron.sql),
 * never by a browser. Authorized by a shared secret header instead of a
 * user/console session — there is no human caller. Groups every lead whose
 * `follow_up_at` has passed (and isn't won/lost) by its assigned agent, and
 * sends each agent one summary email via SNDR.
 */
function assertValidCronSecret(request: NextRequest) {
  const expected = requireEnv('INTERNAL_CRON_SECRET');
  const provided = request.headers.get('x-internal-cron-secret') ?? '';
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  const valid = expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);
  if (!valid) {
    throw new ApiError(401, 'unauthorized', 'unauthorized');
  }
}

function formatFollowUpDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildDigestHtml(agentName: string, leads: Lead[]): string {
  const rows = leads
    .map(
      (lead) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${lead.full_name}</td><td style="padding:8px 12px;border-bottom:1px solid #eee" dir="ltr">${lead.phone ?? '—'}</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${formatFollowUpDate(lead.follow_up_at as string)}</td></tr>`,
    )
    .join('');

  return `<div dir="rtl" style="font-family:sans-serif">
    <p>مرحبًا ${agentName}،</p>
    <p>لديك ${leads.length} من العملاء المحتملين تجاوز موعد متابعتهم:</p>
    <table style="border-collapse:collapse;width:100%;text-align:right">
      <thead><tr><th style="padding:8px 12px;text-align:right">الاسم</th><th style="padding:8px 12px;text-align:right">الجوال</th><th style="padding:8px 12px;text-align:right">موعد المتابعة</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#666;font-size:13px">هذه رسالة تذكير يومية آلية من سبعة.</p>
  </div>`;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  assertValidCronSecret(request);

  const supabase = createServiceRoleClient();
  const nowIso = new Date().toISOString();

  // Same overdue-follow-up condition as GET /v1/dashboard/summary.
  const { data: overdueLeads, error: leadsError } = await supabase
    .from('leads')
    .select('id, tenant_id, full_name, phone, follow_up_at, assigned_agent_id')
    .lt('follow_up_at', nowIso)
    .not('status', 'in', '(won,lost)')
    .not('assigned_agent_id', 'is', null);
  if (leadsError) {
    throw new Error(`Failed to load overdue leads for daily digest: ${leadsError.message}`);
  }
  if (!overdueLeads || overdueLeads.length === 0) {
    return okResponse({ agents_notified: 0, agents_failed: 0, leads_included: 0 });
  }

  const agentIds = [...new Set(overdueLeads.map((lead) => lead.assigned_agent_id as string))];
  const { data: agents, error: agentsError } = await supabase
    .from('users')
    .select('id, tenant_id, full_name, email')
    .in('id', agentIds)
    .eq('status', 'active');
  if (agentsError) {
    throw new Error(`Failed to load agents for daily digest: ${agentsError.message}`);
  }

  const tenantIds = [...new Set((agents ?? []).map((agent) => agent.tenant_id as string))];
  const { data: activeTenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id')
    .in('id', tenantIds)
    .eq('status', 'active');
  if (tenantsError) {
    throw new Error(`Failed to load tenants for daily digest: ${tenantsError.message}`);
  }
  const activeTenantIds = new Set((activeTenants ?? []).map((tenant) => tenant.id as string));
  const grouped = groupEligibleLeadsByAgent(overdueLeads as Lead[], agents ?? [], activeTenantIds);

  const sndr = getSndrClient();
  const fromAddress = requireEnv('SNDR_FROM_EMAIL');

  const results = await Promise.allSettled(
    [...grouped.values()].map(({ agent, leads }) =>
      sndr.emails.send({
        from: fromAddress,
        to: agent.email as string,
        subject: `لديك ${leads.length} متابعة متأخرة — سبعة`,
        html: buildDigestHtml(agent.full_name, leads),
      }),
    ),
  );

  const agentsNotified = results.filter((result) => result.status === 'fulfilled').length;
  const agentsFailed = results.filter((result) => result.status === 'rejected').length;
  if (agentsFailed > 0) {
    const firstFailure = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
    console.error(`Daily digest: ${agentsFailed} email(s) failed to send`, firstFailure?.reason);
  }

  return okResponse({
    agents_notified: agentsNotified,
    agents_failed: agentsFailed,
    leads_included: [...grouped.values()].reduce((sum, { leads }) => sum + leads.length, 0),
  });
});
