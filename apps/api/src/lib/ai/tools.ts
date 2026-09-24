import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CallerContext } from '@/lib/auth/get-caller-context';
import { ApiError, databaseWriteError } from '@/lib/http';
import { assertPermission } from '@/lib/auth/permissions';
import { assertAssignedLeadAccess, isAssignedScope } from '@/lib/auth/crm-scope';

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
    name: 'add_lead_note',
    description: 'يضيف ملاحظة إلى عميل محتمل موجود. استخدم search_leads أولًا إذا لم يكن lead_id معروفًا.',
    parameters: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'معرف العميل المحتمل UUID' },
        note_text: { type: 'string', description: 'نص الملاحظة' },
      },
      required: ['lead_id', 'note_text'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'set_lead_follow_up',
    description: 'يحدد أو يلغي موعد متابعة لعميل محتمل. استخدم search_leads أولًا إذا لم يكن lead_id معروفًا.',
    parameters: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'معرف العميل المحتمل UUID' },
        follow_up_at: { type: ['string', 'null'], description: 'موعد ISO 8601 مع المنطقة الزمنية، أو null لإلغاء الموعد' },
      },
      required: ['lead_id', 'follow_up_at'],
      additionalProperties: false,
    },
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
    const args = z.object({ query: z.string().trim().max(100).default('') }).parse(input.arguments);
    const escaped = args.query.replace(/[%,]/g, '');
    const { data, error } = await supabase
      .from('leads')
      .select('id, full_name, phone, email, status, source, follow_up_at, created_at')
      .eq('tenant_id', caller.tenantId)
      .or(escaped ? `full_name.ilike.%${escaped}%,phone.ilike.%${escaped}%` : 'id.not.is.null')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw new Error(`Failed to search leads: ${error.message}`);
    return { leads: data ?? [] };
  }

  if (name === 'search_projects') {
    assertPermission(caller.role, 'projects.read');
    const args = z.object({ query: z.string().trim().max(100).default('') }).parse(input.arguments);
    const escaped = args.query.replace(/[%,]/g, '');
    const { data, error } = await supabase.from('projects').select('id, name_ar, name_en, status, reference_number, slug, created_at').eq('tenant_id', caller.tenantId).or(escaped ? `name_ar.ilike.%${escaped}%,name_en.ilike.%${escaped}%,reference_number.ilike.%${escaped}%` : 'id.not.is.null').order('created_at', { ascending: false }).limit(10);
    if (error) throw new Error(`Failed to search projects: ${error.message}`);
    return { projects: data ?? [] };
  }

  if (name === 'search_listings') {
    assertPermission(caller.role, 'properties.read');
    const args = z.object({ query: z.string().trim().max(100).default('') }).parse(input.arguments);
    const escaped = args.query.replace(/[%,]/g, '');
    const { data, error } = await supabase.from('listings').select('id, listing_number, title_ar, title_en, listing_type, publication_status, commercial_status, asking_price, created_at').eq('tenant_id', caller.tenantId).or(escaped ? `title_ar.ilike.%${escaped}%,title_en.ilike.%${escaped}%,listing_number.ilike.%${escaped}%` : 'id.not.is.null').order('created_at', { ascending: false }).limit(10);
    if (error) throw new Error(`Failed to search listings: ${error.message}`);
    return { listings: data ?? [] };
  }

  if (name === 'add_lead_note') {
    const grant = assertPermission(caller.role, 'crm.update');
    const args = z.object({
      lead_id: z.string().uuid(),
      note_text: z.string().trim().min(1).max(4000),
    }).parse(input.arguments);
    if (isAssignedScope(grant)) await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, args.lead_id);
    const { data: lead, error: leadError } = await supabase.from('leads').select('id, full_name').eq('id', args.lead_id).eq('tenant_id', caller.tenantId).maybeSingle();
    if (leadError) throw new Error(`Failed to validate lead: ${leadError.message}`);
    if (!lead) throw new ApiError(404, 'lead_not_found', 'العميل المحتمل غير موجود');
    const { data, error } = await supabase.from('lead_notes').insert({
      lead_id: args.lead_id,
      user_id: caller.userId,
      note_text: args.note_text,
    }).select('id, lead_id, note_text, created_at').single();
    if (error) throw databaseWriteError(error, 'Failed to add AI lead note');
    return { lead: { id: lead.id, full_name: lead.full_name }, note: data };
  }

  if (name === 'set_lead_follow_up') {
    const grant = assertPermission(caller.role, 'crm.update');
    const args = z.object({
      lead_id: z.string().uuid(),
      follow_up_at: z.string().datetime({ offset: true }).nullable(),
    }).parse(input.arguments);
    if (isAssignedScope(grant)) await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, args.lead_id);
    const { data: previous, error: previousError } = await supabase.from('leads').select('id, full_name, follow_up_at').eq('id', args.lead_id).eq('tenant_id', caller.tenantId).maybeSingle();
    if (previousError) throw new Error(`Failed to load lead: ${previousError.message}`);
    if (!previous) throw new ApiError(404, 'lead_not_found', 'العميل المحتمل غير موجود');
    const { data, error } = await supabase.from('leads').update({ follow_up_at: args.follow_up_at }).eq('id', args.lead_id).eq('tenant_id', caller.tenantId).select('id, full_name, follow_up_at').single();
    if (error) throw databaseWriteError(error, 'Failed to set AI lead follow-up');
    if (previous.follow_up_at !== args.follow_up_at) {
      const { error: activityError } = await supabase.from('crm_activities').insert({
        tenant_id: caller.tenantId,
        lead_id: args.lead_id,
        user_id: caller.userId,
        activity_type: 'follow_up_changed',
        summary: args.follow_up_at ? 'تم تحديد موعد متابعة للعميل' : 'تم إلغاء موعد متابعة العميل',
        metadata: { from: previous.follow_up_at ?? null, to: args.follow_up_at },
      });
      if (activityError) console.error('Failed to record AI follow-up activity', activityError);
    }
    return { lead: data };
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
