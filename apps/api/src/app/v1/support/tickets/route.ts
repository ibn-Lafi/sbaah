import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const inputSchema = z.object({
  type: z.enum(['complaint','suggestion','support']),
  category: z.enum(['billing','technical','account','website','domain','other']),
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
});

function ticketNumber() {
  return `SBA-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to list support tickets: ${error.message}`);
  return okResponse({ tickets: data ?? [] });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const input = inputSchema.parse(await request.json());
  const { data: user } = await supabase.from('users').select('full_name,email,phone').eq('id', caller.userId).single();
  const { data, error } = await supabase.from('support_tickets').insert({
    ...input, ticket_number: ticketNumber(), tenant_id: caller.tenantId, created_by_user_id: caller.userId,
    requester_name: user?.full_name ?? 'عميل سبعة', requester_email: user?.email ?? '', requester_phone: user?.phone ?? null,
  }).select().single();
  if (error) throw new Error(`Failed to create support ticket: ${error.message}`);
  return okResponse({ ticket: data }, 201);
});
