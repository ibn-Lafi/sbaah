import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

const updateSchema = z.object({ status: z.enum(['open','in_progress','waiting_customer','resolved','closed']).optional(), priority: z.enum(['low','normal','high','urgent']).optional() });
const replySchema = z.object({ message: z.string().trim().min(1).max(5000) });

export const GET = withErrorHandling<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const { id } = await params; const { supabase } = await getPlatformAdminClient(request);
  const { data, error } = await supabase.from('support_tickets').select('*, support_ticket_messages(*)').eq('id', id).order('created_at', { foreignTable: 'support_ticket_messages', ascending: true }).maybeSingle();
  if (error) throw new Error(error.message); if (!data) throw new ApiError(404,'ticket_not_found','التذكرة غير موجودة');
  return okResponse({ ticket: data });
});
export const PATCH = withErrorHandling<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const { id } = await params; const { supabase } = await getPlatformAdminClient(request); const input=updateSchema.parse(await request.json());
  const { data,error }=await supabase.from('support_tickets').update(input).eq('id',id).select().single(); if(error) throw new Error(error.message); return okResponse({ticket:data});
});
export const POST = withErrorHandling<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const { id } = await params; const { supabase } = await getPlatformAdminClient(request); const input=replySchema.parse(await request.json());
  const { data: auth }=await supabase.auth.getUser(); const { data: admin }=await supabase.from('platform_admins').select('id').eq('auth_user_id',auth.user?.id ?? '').single();
  const { data,error }=await supabase.from('support_ticket_messages').insert({ticket_id:id,sender_type:'admin',sender_admin_id:admin?.id,message:input.message}).select().single();
  if(error) throw new Error(error.message); await supabase.from('support_tickets').update({status:'waiting_customer'}).eq('id',id); return okResponse({message:data},201);
});
