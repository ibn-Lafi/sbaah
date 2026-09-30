import { AI_TOOL_DEFINITIONS } from '@/lib/ai/tools';
export type AiChannel = 'assistant' | 'whatsapp';
export type AiToolRisk = 'read' | 'write' | 'sensitive';

interface ToolPolicy {
  channels: readonly AiChannel[];
  risk: AiToolRisk;
}

const POLICIES: Record<string, ToolPolicy> = {
  get_portfolio_summary: { channels: ['assistant'], risk: 'read' },
  search_leads: { channels: ['assistant'], risk: 'read' },
  search_projects: { channels: ['assistant', 'whatsapp'], risk: 'read' },
  search_listings: { channels: ['assistant', 'whatsapp'], risk: 'read' },
  add_lead_interest: { channels: ['assistant', 'whatsapp'], risk: 'write' },
  add_lead_note: { channels: ['assistant', 'whatsapp'], risk: 'write' },
  set_lead_follow_up: { channels: ['assistant', 'whatsapp'], risk: 'write' },
  update_lead_status: { channels: ['assistant'], risk: 'sensitive' },
  create_lead: { channels: ['assistant', 'whatsapp'], risk: 'sensitive' },
};

const definitionsByName = new Map<string, (typeof AI_TOOL_DEFINITIONS)[number]>(AI_TOOL_DEFINITIONS.map((tool) => [tool.name, tool]));

export function getToolPolicy(name: string): ToolPolicy | null {
  return POLICIES[name] ?? null;
}

export function isToolAllowed(channel: AiChannel, name: string) {
  const policy = getToolPolicy(name);
  return Boolean(policy?.channels.includes(channel));
}

export function getToolsForChannel(channel: AiChannel) {
  return Object.entries(POLICIES)
    .filter(([, policy]) => policy.channels.includes(channel))
    .map(([name]) => definitionsByName.get(name))
    .filter((tool): tool is (typeof AI_TOOL_DEFINITIONS)[number] => Boolean(tool));
}

export function assertToolRegistryComplete() {
  const definitionNames = new Set<string>(AI_TOOL_DEFINITIONS.map((tool) => tool.name));
  const policyNames = new Set<string>(Object.keys(POLICIES));
  const missingPolicies = [...definitionNames].filter((name) => !policyNames.has(name));
  const orphanPolicies = [...policyNames].filter((name) => !definitionNames.has(name));
  if (missingPolicies.length || orphanPolicies.length) {
    throw new Error(`AI tool registry mismatch: missing=[${missingPolicies.join(',')}], orphan=[${orphanPolicies.join(',')}]`);
  }
}
