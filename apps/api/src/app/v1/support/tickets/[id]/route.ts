import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const replySchema = z.object({ message: z.string().trim().min(1).max(5000) });

export const GET = withErrorHandling<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const { data, error } = await supabase.from('support_tickets').select('*, support_ticket_messages(*)').eq('id', id).order('created_at', { foreignTable: 'support_ticket_messages', ascending: true }).maybeSingle();
  if (error) throw new Error(`Failed to load support ticket: ${error.message}`);
  if (!data) throw new ApiError(404, 'ticket_not_found', 'التذكرة غير موجودة');
  return okResponse({ ticket: data });
});

export const POST = withErrorHandling<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const input = replySchema.parse(await request.json());
  const { data, error } = await supabase.from('support_ticket_messages').insert({ ticket_id: id, sender_type: 'customer', sender_user_id: caller.userId, message: input.message }).select().single();
  if (error) throw new Error(`Failed to reply to support ticket: ${error.message}`);
  return okResponse({ message: data }, 201);
});
