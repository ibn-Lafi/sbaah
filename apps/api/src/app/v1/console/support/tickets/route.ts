import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const status = z.enum(['open','in_progress','waiting_customer','resolved','closed']).optional().parse(request.nextUrl.searchParams.get('status') || undefined);
  let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list support tickets: ${error.message}`);
  return okResponse({ tickets: data ?? [] });
});
