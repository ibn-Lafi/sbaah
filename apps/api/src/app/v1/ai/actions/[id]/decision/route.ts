import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { executeAiTool } from '@/lib/ai/tools';

const paramsSchema = z.object({ id: z.string().uuid() });
const bodySchema = z.object({ decision: z.enum(['confirm', 'cancel']), input: z.record(z.string(), z.unknown()).optional() });

export const POST = withErrorHandling(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const systemSupabase = createServiceRoleClient();
  const { id } = paramsSchema.parse(await context.params);
  const { decision, input } = bodySchema.parse(await request.json());

  const { data: action, error } = await systemSupabase
    .from('ai_action_logs')
    .select('id, tenant_id, requested_by, tool_name, input, status, risk_level')
    .eq('id', id)
    .eq('tenant_id', caller.tenantId)
    .eq('requested_by', caller.userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load AI action: ${error.message}`);
  if (!action) throw new ApiError(404, 'ai_action_not_found', 'الإجراء غير موجود');
  if (action.risk_level !== 'sensitive' || action.status !== 'awaiting_confirmation') {
    throw new ApiError(409, 'ai_action_not_pending', 'هذا الإجراء لا ينتظر التأكيد');
  }

  if (decision === 'cancel') {
    const { error: cancelError } = await systemSupabase.from('ai_action_logs')
      .update({ status: 'cancelled' })
      .eq('id', action.id)
      .eq('status', 'awaiting_confirmation');
    if (cancelError) throw new Error(`Failed to cancel AI action: ${cancelError.message}`);
    return okResponse({ action_id: action.id, status: 'cancelled' });
  }

  const confirmedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await systemSupabase.from('ai_action_logs')
    .update({ status: 'running', confirmed_at: confirmedAt, executed_at: confirmedAt })
    .eq('id', action.id)
    .eq('status', 'awaiting_confirmation')
    .select('id')
    .maybeSingle();
  if (claimError) throw new Error(`Failed to confirm AI action: ${claimError.message}`);
  if (!claimed) throw new ApiError(409, 'ai_action_already_handled', 'تم التعامل مع هذا الإجراء مسبقًا');

  try {
    const executionInput = action.tool_name === 'create_lead' && input ? input : action.input;
    const result = await executeAiTool({ supabase, caller, name: action.tool_name, arguments: executionInput });
    await systemSupabase.from('ai_action_logs').update({ status: 'succeeded', output: result }).eq('id', action.id);
    return okResponse({ action_id: action.id, status: 'succeeded', result });
  } catch (executionError) {
    await systemSupabase.from('ai_action_logs').update({
      status: 'failed',
      error_message: executionError instanceof Error ? executionError.message.slice(0, 1000) : 'Unknown tool error',
    }).eq('id', action.id);
    throw executionError;
  }
});
