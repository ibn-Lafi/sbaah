import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, extractClientIp, okResponse, withErrorHandling } from '@/lib/http';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit/enforce-rate-limit';

const createSchema = z.object({
  requester_name: z.string().trim().min(2).max(120),
  requester_email: z.string().trim().toLowerCase().email().max(200),
  requester_phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((value) => value || undefined),
  type: z.enum(['complaint', 'suggestion', 'support']),
  category: z.enum(['billing', 'technical', 'account', 'website', 'domain', 'other']),
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
});
const trackSchema = z.object({
  ticket_number: z.string().trim().min(6).max(40),
  requester_email: z.string().trim().toLowerCase().email(),
});

function ticketNumber() {
  return `SBA-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
}

/** Anonymous support tickets from the marketing site's /support page. */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = createSchema.parse(await request.json());
  const supabase = createServiceRoleClient();
  await enforceRateLimit(supabase, RATE_LIMITS.supportTicketPerIp, extractClientIp(request.headers));

  const { data, error } = await supabase
    .from('support_tickets')
    .insert({ ...input, ticket_number: ticketNumber(), requester_phone: input.requester_phone || null })
    .select('id,ticket_number,status,created_at')
    .single();
  if (error) throw new Error(`Failed to create public support ticket: ${error.message}`);
  return okResponse({ ticket: data }, 201);
});

/**
 * Tracking needs both the ticket number and the requester's email. Emails
 * are stored lowercased (createSchema), so this is an exact match — an
 * ILIKE here treated `_` in the supplied address as a wildcard.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const input = trackSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = createServiceRoleClient();
  await enforceRateLimit(supabase, RATE_LIMITS.supportLookupPerIp, extractClientIp(request.headers));

  const { data, error } = await supabase
    .from('support_tickets')
    .select(
      'id,ticket_number,type,category,subject,status,priority,created_at,updated_at,support_ticket_messages(sender_type,message,created_at)',
    )
    .eq('ticket_number', input.ticket_number)
    .eq('requester_email', input.requester_email)
    .maybeSingle();
  if (error) throw new Error(`Failed to look up support ticket: ${error.message}`);
  if (!data) throw new ApiError(404, 'ticket_not_found', 'لم نعثر على تذكرة مطابقة لرقم التذكرة والبريد الإلكتروني');
  return okResponse({ ticket: data });
});
