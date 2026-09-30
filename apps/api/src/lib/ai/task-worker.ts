import type { SupabaseClient } from '@supabase/supabase-js';

export interface AiTask {
  id: string;
  tenant_id: string;
  task_type: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  source_event_id: string | null;
}

export type AiTaskHandler = (task: AiTask) => Promise<void>;

export async function claimAiTasks(input: {
  systemSupabase: SupabaseClient;
  workerId: string;
  limit?: number;
  lockTimeoutSeconds?: number;
}): Promise<AiTask[]> {
  const { data, error } = await input.systemSupabase.schema('private').rpc('claim_ai_tasks', {
    p_worker_id: input.workerId,
    p_limit: input.limit ?? 10,
    p_lock_timeout_seconds: input.lockTimeoutSeconds ?? 120,
  });
  if (error) throw new Error(`Failed to claim AI tasks: ${error.message}`);
  return (data ?? []) as AiTask[];
}

export async function completeAiTask(input: {
  systemSupabase: SupabaseClient;
  taskId: string;
  workerId: string;
}) {
  const { data, error } = await input.systemSupabase.schema('private').rpc('complete_ai_task', {
    p_task_id: input.taskId,
    p_worker_id: input.workerId,
  });
  if (error) throw new Error(`Failed to complete AI task: ${error.message}`);
  if (data !== true) throw new Error('AI task lock was lost before completion');
}

export async function failAiTask(input: {
  systemSupabase: SupabaseClient;
  taskId: string;
  workerId: string;
  error: unknown;
  baseDelaySeconds?: number;
}) {
  const message = input.error instanceof Error ? input.error.message : String(input.error);
  const { data, error } = await input.systemSupabase.schema('private').rpc('fail_ai_task', {
    p_task_id: input.taskId,
    p_worker_id: input.workerId,
    p_error: message,
    p_base_delay_seconds: input.baseDelaySeconds ?? 5,
  });
  if (error) throw new Error(`Failed to reschedule AI task: ${error.message}`);
  if (data === 'not_owned') throw new Error('AI task lock was lost before failure handling');
  return data as 'pending' | 'failed';
}

export async function processAiTaskBatch(input: {
  systemSupabase: SupabaseClient;
  workerId: string;
  handlers: Record<string, AiTaskHandler>;
  limit?: number;
}) {
  const tasks = await claimAiTasks({
    systemSupabase: input.systemSupabase,
    workerId: input.workerId,
    limit: input.limit,
  });

  const results = [];
  for (const task of tasks) {
    const handler = input.handlers[task.task_type];
    try {
      if (!handler) throw new Error(`No handler registered for task type: ${task.task_type}`);
      await handler(task);
      await completeAiTask({ systemSupabase: input.systemSupabase, taskId: task.id, workerId: input.workerId });
      results.push({ id: task.id, status: 'completed' as const });
    } catch (error) {
      const status = await failAiTask({
        systemSupabase: input.systemSupabase,
        taskId: task.id,
        workerId: input.workerId,
        error,
      });
      results.push({ id: task.id, status });
    }
  }
  return results;
}
