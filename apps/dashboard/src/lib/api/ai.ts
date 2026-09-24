import { apiGet, apiPut } from './client';

export interface AiAssistant {
  id: string;
  tenant_id: string;
  name: string;
  personality: string;
  status: 'active' | 'paused';
  created_at: string;
  updated_at: string;
}

export function getAiAssistant(accessToken: string) {
  return apiGet<AiAssistant | null>('/ai/assistant', accessToken);
}

export function saveAiAssistant(accessToken: string, input: { name: string; personality: string }) {
  return apiPut<AiAssistant>('/ai/assistant', input, accessToken);
}
