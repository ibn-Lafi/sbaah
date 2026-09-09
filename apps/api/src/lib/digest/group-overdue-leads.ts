import type { Lead } from '@sbaah/shared';

export interface DigestAgent {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string | null;
}

/**
 * Pure — no Supabase/network calls — so it can be unit-tested directly with
 * plain arrays. Called by POST /v1/internal/cron/daily-digest (task 41/42)
 * after that route fetches overdue leads, their assigned agents, and which
 * of those agents' tenants are active.
 *
 * An agent is eligible only if: their own `status` is 'active' (the caller
 * is expected to have already filtered `agents` to that), they have an
 * email on file, and their tenant is active — a suspended tenant's members
 * can't act on the reminder anyway (RLS write-lock, migration 0019), so
 * emailing them would be noise.
 */
export function groupEligibleLeadsByAgent(
  overdueLeads: Lead[],
  agents: DigestAgent[],
  activeTenantIds: Set<string>,
): Map<string, { agent: DigestAgent; leads: Lead[] }> {
  const eligibleAgentsById = new Map(
    agents.filter((agent) => agent.email && activeTenantIds.has(agent.tenant_id)).map((agent) => [agent.id, agent]),
  );

  const grouped = new Map<string, { agent: DigestAgent; leads: Lead[] }>();
  for (const lead of overdueLeads) {
    const agentId = lead.assigned_agent_id;
    if (!agentId) continue;
    const agent = eligibleAgentsById.get(agentId);
    if (!agent) continue;
    const bucket = grouped.get(agentId) ?? { agent, leads: [] };
    bucket.leads.push(lead);
    grouped.set(agentId, bucket);
  }
  return grouped;
}
