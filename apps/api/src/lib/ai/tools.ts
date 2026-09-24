import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CallerContext } from '@/lib/auth/get-caller-context';
import { ApiError, databaseWriteError } from '@/lib/http';
import { assertPermission } from '@/lib/auth/permissions';

export const AI_TOOL_DEFINITIONS = [
  {
    type: 'function',
    name: 'get_portfolio_summary',
    description: 'يعرض ملخصًا رقميًا حقيقيًا عن العملاء المحتملين والمشاريع والعروض العقارية داخل منشأة المستخدم.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    type: 'function',
    name: 'search_leads',
    description: 'يبحث عن العملاء المحتملين داخل منشأة المستخدم بالاسم أو رقم الجوال. استخدمه قبل الحديث عن عميل محدد.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'اسم العميل أو رقم الجوال' } },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'search_projects',
    description: 'يبحث في مشاريع المنشأة بالاسم ويعيد بيانات مختصرة حقيقية عن المشاريع.',
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
  },
  {
    type: 'function',
    name: 'search_listings',
    description: 'يبحث في العروض العقارية للمنشأة ويعيد بيانات مختصرة حقيقية. استخدمه عند السؤال عن العقارات أو العروض المتاحة.',
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
  },
  {
    type: 'function',
    name: 'create_lead',
    description: 'ينشئ عميلًا محتملًا يدويًا داخل CRM في سبعة. لا تستخدمه إلا عندما يطلب المستخدم إنشاء/إضافة العميل.',
    parameters: {
      type: 'object',
      properties: {
        full_name: { type: 'string' },
        phone: { type: 'string', description: 'رقم جوال سعودي' },
        email: { type: ['string', 'null'] },
        asset_id: { type: ['string', 'null'] },
        listing_id: { type: ['string', 'null'] },
      },
      required: ['full_name', 'phone'],
      additionalProperties: false,
    },
  },
] as const;

const createLeadSchema = z.object({
  full_name: z.string().trim().min(2),
  phone: z.string().trim().regex(/^(?:\+966|00966|966|0)?5\d{8}$/),
  email: z.string().email().nullable().optional(),
  asset_id: z.string().uuid().nullable().optional(),
  listing_id: z.string().uuid().nullable().optional(),
}).refine((value) => !(value.asset_id && value.listing_id), 'اختر عقارًا أو عرضًا واحدًا فقط');

export async function executeAiTool(input: {
  supabase: SupabaseClient;
  caller: CallerContext;
  name: string;
  arguments: unknown;
}) {
  const { supabase, caller, name } = input;

  if (name === 'get_portfolio_summary') {
    assertPermission(caller.role, 'crm.read');
    const [leads, projects, listings] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('tenant_id', caller.tenantId),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('tenant_id', caller.tenantId),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('tenant_id', caller.tenantId),
    ]);
    if (leads.error || projects.error || listings.error) throw new Error('Failed to load portfolio summary');
    return { leads: leads.count ?? 0, projects: projects.count ?? 0, listings: listings.count ?? 0 };
  }

  if (name === 'search_leads') {
    assertPermission(caller.role, 'crm.read');
    const args = z.object({ query: z.string().trim().min(1).max(100) }).parse(input.arguments);
    const escaped = args.query.replace(/[%,]/g, '');
    const { data, error } = await supabase
      .from('leads')
      .select('id, full_name, phone, email, status, source, follow_up_at, created_at')
      .eq('tenant_id', caller.tenantId)
      .or(`full_name.ilike.%${escaped}%,phone.ilike.%${escaped}%`)
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw new Error(`Failed to search leads: ${error.message}`);
    return { leads: data ?? [] };
  }

  if (name === 'search_projects') {
    assertPermission(caller.role, 'projects.read');
    const args = z.object({ query: z.string().trim().min(1).max(100) }).parse(input.arguments);
    const escaped = args.query.replace(/[%,]/g, '');
    const { data, error } = await supabase.from('projects').select('id, name, status, created_at').eq('tenant_id', caller.tenantId).ilike('name', `%${escaped}%`).order('created_at', { ascending: false }).limit(10);
    if (error) throw new Error(`Failed to search projects: ${error.message}`);
    return { projects: data ?? [] };
  }

  if (name === 'search_listings') {
    assertPermission(caller.role, 'properties.read');
    const args = z.object({ query: z.string().trim().min(1).max(100) }).parse(input.arguments);
    const escaped = args.query.replace(/[%,]/g, '');
    const { data, error } = await supabase.from('listings').select('id, title, listing_type, status, price, created_at').eq('tenant_id', caller.tenantId).ilike('title', `%${escaped}%`).order('created_at', { ascending: false }).limit(10);
    if (error) throw new Error(`Failed to search listings: ${error.message}`);
    return { listings: data ?? [] };
  }

  if (name === 'create_lead') {
    if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية إضافة عملاء محتملين يدويًا');
    const args = createLeadSchema.parse(input.arguments);
    const interest = args.asset_id ? { asset_id: args.asset_id } : args.listing_id ? { listing_id: args.listing_id } : null;
    const { asset_id: _assetId, listing_id: _listingId, ...lead } = args;
    const { data, error } = await supabase.rpc('create_lead_with_interest', {
      p_lead: { ...lead, source: 'manual' },
      p_interest: interest,
    }).single();
    if (error) throw databaseWriteError(error, 'Failed to create AI lead');
    if (!data) throw new ApiError(500, 'lead_create_failed', 'تعذر إنشاء العميل المحتمل');
    return { lead: data };
  }

  throw new ApiError(400, 'unknown_ai_tool', 'أداة مساعد Ai غير معروفة');
}
