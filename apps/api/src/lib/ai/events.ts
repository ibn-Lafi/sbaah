import type { SupabaseClient } from '@supabase/supabase-js';

export type SbaahEventSource = 'assistant' | 'whatsapp' | 'system' | 'crm';

export async function publishAiEvent(input: {
  systemSupabase: SupabaseClient;
  tenantId: string;
  eventType: string;
  source: SbaahEventSource;
  actorUserId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  correlationId?: string | null;
  idempotencyKey?: string | null;
  payload?: Record<string, unknown>;
}) {
  const { data, error } = await input.systemSupabase.from('ai_events').insert({
    tenant_id: input.tenantId,
    event_type: input.eventType,
    source: input.source,
    actor_user_id: input.actorUserId ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    correlation_id: input.correlationId ?? null,
    idempotency_key: input.idempotencyKey ?? null,
    payload: input.payload ?? {},
  }).select('id,event_type,occurred_at').single();

  if (error) {
    if (error.code === '23505' && input.idempotencyKey) {
      const { data: existing, error: existingError } = await input.systemSupabase
        .from('ai_events').select('id,event_type,occurred_at')
        .eq('tenant_id', input.tenantId).eq('idempotency_key', input.idempotencyKey).single();
      if (existingError) throw new Error(`Failed to resolve idempotent AI event: ${existingError.message}`);
      return existing;
    }
    throw new Error(`Failed to publish AI event: ${error.message}`);
  }
  return data;
}

export async function enqueueAiTask(input: {
  systemSupabase: SupabaseClient;
  tenantId: string;
  taskType: string;
  sourceEventId?: string | null;
  idempotencyKey?: string | null;
  priority?: number;
  payload?: Record<string, unknown>;
  availableAt?: string;
}) {
  const { data, error } = await input.systemSupabase.from('ai_tasks').insert({
    tenant_id: input.tenantId,
    task_type: input.taskType,
    source_event_id: input.sourceEventId ?? null,
    idempotency_key: input.idempotencyKey ?? null,
    priority: input.priority ?? 100,
    payload: input.payload ?? {},
    available_at: input.availableAt ?? new Date().toISOString(),
  }).select('id,task_type,status,available_at').single();

  if (error) {
    if (error.code === '23505' && input.idempotencyKey) {
      const { data: existing, error: existingError } = await input.systemSupabase
        .from('ai_tasks').select('id,task_type,status,available_at')
        .eq('tenant_id', input.tenantId).eq('idempotency_key', input.idempotencyKey).single();
      if (existingError) throw new Error(`Failed to resolve idempotent AI task: ${existingError.message}`);
      return existing;
    }
    throw new Error(`Failed to enqueue AI task: ${error.message}`);
  }
  return data;
}
