-- =============================================================================
-- Migration 0047: تجربة مجانية 14 يومًا + إعادة تصميم خطوات التسجيل
--
-- طلب المؤسس: خطوات التسجيل الجديدة (هاتف -> OTP -> الاسم+البريد+كلمة
-- المرور -> نوع الحساب -> الباقة) — بيانات الشركة/المؤسسة (فال، الرقم
-- الضريبي، السجل التجاري، اسم الجهة) لم تعد تُطلب أثناء التسجيل إطلاقًا؛
-- تُدخَل لاحقًا من داخل النظام (حسابي). الحساب يعمل بكامل ميزاته بلا هذه
-- البيانات — الاستثناء الوحيد: موقعه العام (public-site) لا يُنشر لحين
-- إكمالها.
--
-- كذلك باقة "تجربة مجانية" جديدة (صف باقة حقيقي بجدول plans، تظهر
-- بقائمة console → الباقات للمتابعة): بميزات الباقة الأساسية، بلا أي
-- رسوم، لـ14 يومًا فقط. تُختار حصرًا بخطوة التسجيل الأخيرة (لا تظهر
-- إطلاقًا بصفحة "الفوترة" أو أي تبديل باقة لاحق) — تُستهلك مرة واحدة
-- بحكم كونها فرصة تسجيل جديد فقط، فلا حاجة لعلم "تم استخدامها من قبل".
--
-- بعد 14 يومًا بلا اشتراك حقيقي: الحساب يُعامل تمامًا كالحساب الموقوف
-- (is_tenant_active يرجع false) — القراءة فقط بالوحة، والموقع العام
-- يعرض "غير متاح حاليًا"، حتى يشترك المستأجر بباقة حقيقية (checkout
-- الاعتيادي يستبدل plan_id ويُخلي trial_ends_at تلقائيًا عبر webhook
-- سترييم باي الموجود أصلًا — لا تعديل عليه هنا).
-- =============================================================================

alter table tenants add column trial_ends_at timestamptz;

-- بيانات الشركة/المؤسسة لم تعد تُجمع أثناء التسجيل — القيد القديم كان
-- يفرض NOT NULL على cr_number/tax_number لحظة الإنشاء لحسابات
-- مؤسسة/شركة، وهذا لم يعد ممكنًا. يبقى الاتجاه المعاكس فقط: حساب "فرد"
-- لا يملك سجلًا تجاريًا أو رقمًا ضريبيًا أبدًا.
alter table tenants drop constraint tenants_org_fields_required;
alter table tenants add constraint tenants_individual_no_org_fields check (
  account_type != 'individual' or (cr_number is null and tax_number is null)
);

-- رخصة فال لم تعد إلزامية عند الإنشاء (تُملأ لاحقًا من حسابي) — كانت
-- NOT NULL صريحًا بجدول tenants (migration 0001).
alter table tenants alter column fal_license_number drop not null;

alter table plans add column is_trial boolean not null default false;

-- الحد "بلا نهاية" (max_properties/max_users) لباقة الأساسية الحالية:
-- 15 عقارًا، مستخدم واحد (migration 0006/0027) — التجربة تطابقها تمامًا.
insert into plans (name_ar, name_en, billing_cycle, price, max_properties, max_users, custom_domain_allowed, is_active, is_trial, description_ar)
values ('تجربة مجانية', 'Free Trial', 'monthly', 0, 15, 1, false, true, true, 'تجربة مجانية 14 يومًا بميزات الباقة الأساسية، بلا أي رسوم');

-- ---------------------------------------------------------------------------
-- is_tenant_active — حساب انتهت تجربته المجانية بلا اشتراك حقيقي يُعامل
-- تمامًا كالموقوف: هذه الدالة تُستخدم أصلًا بكل سياسات RLS المقيِّدة
-- للكتابة (migration 0019) وبكل قراءات الموقع العام غير المباشرة
-- (migrations 0005/0009/0024/0025) — تعديلها هنا يمتد لكل ذلك تلقائيًا
-- بلا أي سياسة RLS جديدة.
-- ---------------------------------------------------------------------------
create or replace function is_tenant_active(check_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from tenants
    where id = check_tenant_id
      and status = 'active'
      and (trial_ends_at is null or trial_ends_at > now())
  );
$$;

-- ---------------------------------------------------------------------------
-- resolve_public_tenant — تُستخدم مباشرة (لا عبر is_tenant_active) بمسارات
-- الموقع العام الأخرى (العقارات، تحقق الطلبات) لذا تحتاج نفس الإضافتين:
-- انتهاء التجربة، وعدم اكتمال بيانات الحساب (فال لأي نوع، +السجل/الضريبي
-- لمؤسسة/شركة) — كلاهما يُعامل كـ"الحساب غير متاح" لهذه المسارات، تمامًا
-- كطلب المؤسس بأن الموقع العام تحديدًا لا يُنشر لحين اكتمال البيانات.
-- ---------------------------------------------------------------------------
create or replace function resolve_public_tenant(p_subdomain text, p_custom_domain text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from tenants
  where status = 'active'
    and (trial_ends_at is null or trial_ends_at > now())
    and fal_license_number is not null
    and (account_type = 'individual' or (cr_number is not null and tax_number is not null))
    and (
      (p_subdomain is not null and subdomain = p_subdomain)
      or (p_custom_domain is not null and custom_domain = p_custom_domain and custom_domain_status = 'verified')
    )
  limit 1;
$$;

-- resolve_public_tenant_chrome (آخر تعريف كامل: migration 0025) يبقى بلا
-- شرط status/اكتمال بيانات عمدًا (يُرجع الصف دومًا ليقرر المستدعي
-- الرسالة المناسبة، كما كان) — يضيف فقط trial_ends_at لتمكين
-- GET /v1/public/website من تمييز "تجربة منتهية" بنفس رسالة "الحساب غير
-- متاح حاليًا". CREATE OR REPLACE لا يكفي هنا (شكل الإرجاع يتغيّر)، لذا
-- DROP ثم CREATE، بنفس نمط 0025.
drop function if exists resolve_public_tenant_chrome(text, text);

create function resolve_public_tenant_chrome(p_subdomain text, p_custom_domain text)
returns table(
  id uuid,
  status tenant_status,
  name_ar text,
  name_en text,
  account_type account_type,
  cr_number text,
  tax_number text,
  fal_license_number text,
  social_instagram text,
  social_tiktok text,
  social_whatsapp text,
  social_snapchat text,
  social_phone text,
  trial_ends_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    id, status, name_ar, name_en, account_type,
    cr_number, tax_number, fal_license_number,
    social_instagram, social_tiktok, social_whatsapp, social_snapchat, social_phone,
    trial_ends_at
  from tenants
  where
    (p_subdomain is not null and subdomain = p_subdomain)
    or (p_custom_domain is not null and custom_domain = p_custom_domain and custom_domain_status = 'verified')
  limit 1;
$$;

grant execute on function resolve_public_tenant_chrome(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_tenant_with_owner (migration 0010) — يفقد 3 معاملات (فال، السجل
-- التجاري، الرقم الضريبي، لم تعد تُجمع بالتسجيل) ويكتسب اثنين (تاريخ
-- انتهاء التجربة، وبريد المالك — users.email موجود أصلًا (migration
-- 0007/0040) لكنه لم يكن يُمرَّر لهذه الدالة قط). قائمة المعاملات تتغيّر
-- فعليًا، لذا DROP صريح بالتوقيع القديم ثم CREATE، لا REPLACE.
-- ---------------------------------------------------------------------------
drop function if exists create_tenant_with_owner(text, text, account_type, text, text, text, text, uuid, uuid, text, text);

create function create_tenant_with_owner(
  p_name_ar text,
  p_name_en text,
  p_account_type account_type,
  p_subdomain text,
  p_plan_id uuid,
  p_trial_ends_at timestamptz,
  p_auth_user_id uuid,
  p_owner_full_name text,
  p_owner_phone text,
  p_owner_email text
)
returns table (tenant_id uuid, user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_user_id uuid;
begin
  insert into tenants (name_ar, name_en, account_type, subdomain, plan_id, trial_ends_at)
  values (p_name_ar, p_name_en, p_account_type, p_subdomain, p_plan_id, p_trial_ends_at)
  returning id into v_tenant_id;

  insert into users (tenant_id, auth_user_id, full_name, phone, email, role)
  values (v_tenant_id, p_auth_user_id, p_owner_full_name, p_owner_phone, p_owner_email, 'owner')
  returning id into v_user_id;

  return query select v_tenant_id, v_user_id;
end;
$$;

revoke all on function create_tenant_with_owner from public;
