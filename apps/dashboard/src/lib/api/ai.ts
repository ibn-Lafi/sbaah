import { apiGet, apiPatch, apiPost } from './client';

export interface AiAssistant {
  id: string;
  tenant_id: string;
  name: string;
  personality: string;
  status: 'active' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface AiConversation {
  id: string;
  assistant_id: string;
  title: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export function getAiAssistant(accessToken: string) {
  return apiGet<AiAssistant | null>('/ai/assistant', accessToken);
}

export function saveAiAssistant(accessToken: string, input: { name: string; personality: string }) {
  return apiPatch<AiAssistant>('/ai/assistant', input, accessToken);
}

export function listAiConversations(accessToken: string) {
  return apiGet<{ conversations: AiConversation[] }>('/ai/conversations', accessToken);
}

export function createAiConversation(accessToken: string, title?: string) {
  return apiPost<AiConversation>('/ai/conversations', title ? { title } : {}, accessToken);
}

export function getAiConversation(accessToken: string, conversationId: string) {
  return apiGet<{ conversation: AiConversation; messages: AiMessage[] }>(`/ai/conversations/${conversationId}`, accessToken);
}

export function sendAiMessage(accessToken: string, conversationId: string, content: string) {
  return apiPost<{ message: AiMessage; assistant_message: AiMessage }>(
    `/ai/conversations/${conversationId}/messages`,
    { content },
    accessToken,
  );
}


export function decideAiAction(accessToken: string, actionId: string, decision: 'confirm' | 'cancel', input?:Record<string,unknown>) {
  return apiPost<{ action_id: string; status: 'cancelled' | 'succeeded'; result?: unknown }>(
    `/ai/actions/${actionId}/decision`,
    input ? { decision, input } : { decision },
    accessToken,
  );
}
