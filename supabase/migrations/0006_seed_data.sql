-- =============================================================================
-- Migration 0006: Seed reference data
-- PRODUCT_SPEC.md sections 2, 6, 9. Run after 0005.
--
-- This is starter data only, not exhaustive — the founder adds more
-- cities/districts/plans later via `console` (PRODUCT_SPEC section 2:
-- "تُدار كبيانات قابلة للتعديل من خدمة console"). Re-running this file is
-- safe: every insert is guarded so it won't create duplicates.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Theme — exactly one row in this version, per PRODUCT_SPEC section 6.
-- ---------------------------------------------------------------------------
insert into themes (name_ar, name_en, is_active)
select 'الثيم الأساسي', 'Primary Theme', true
where not exists (select 1 from themes where name_en = 'Primary Theme');

-- ---------------------------------------------------------------------------
-- Plans — starting values per PRODUCT_SPEC section 2. Flagged there as a
-- proposal pending the founder's own numbers; adjust anytime from
-- `console` without touching code.
-- ---------------------------------------------------------------------------
insert into plans (name_ar, name_en, price, max_properties, max_users, custom_domain_allowed, is_active)
select 'الأساسية', 'Basic', 39, 15, 1, false, true
where not exists (select 1 from plans where name_en = 'Basic');

insert into plans (name_ar, name_en, price, max_properties, max_users, custom_domain_allowed, is_active)
select 'المتقدمة', 'Advanced', 99, 60, 3, true, true
where not exists (select 1 from plans where name_en = 'Advanced');

-- ---------------------------------------------------------------------------
-- Cities — major Saudi cities to start.
-- ---------------------------------------------------------------------------
insert into cities (name_ar, name_en)
select v.name_ar, v.name_en
from (values
  ('الرياض', 'Riyadh'),
  ('جدة', 'Jeddah'),
  ('مكة المكرمة', 'Makkah'),
  ('المدينة المنورة', 'Madinah'),
  ('الدمام', 'Dammam'),
  ('الخبر', 'Khobar'),
  ('الظهران', 'Dhahran'),
  ('الطائف', 'Taif'),
  ('تبوك', 'Tabuk'),
  ('بريدة', 'Buraidah'),
  ('أبها', 'Abha'),
  ('خميس مشيط', 'Khamis Mushait'),
  ('حائل', 'Hail'),
  ('نجران', 'Najran'),
  ('جازان', 'Jazan'),
  ('ينبع', 'Yanbu'),
  ('الجبيل', 'Jubail'),
  ('القطيف', 'Qatif'),
  ('عرعر', 'Arar'),
  ('سكاكا', 'Sakaka')
) as v(name_ar, name_en)
where not exists (select 1 from cities where cities.name_en = v.name_en);

-- ---------------------------------------------------------------------------
-- Districts — starter set for the three largest cities only. The founder
-- adds the rest incrementally via `console` as customers need them.
-- ---------------------------------------------------------------------------
insert into districts (city_id, name_ar, name_en)
select c.id, v.name_ar, v.name_en
from cities c
join (values
  ('Riyadh', 'العليا', 'Olaya'),
  ('Riyadh', 'الملقا', 'Al Malqa'),
  ('Riyadh', 'النرجس', 'Al Narjis'),
  ('Riyadh', 'الياسمين', 'Al Yasmin'),
  ('Riyadh', 'حطين', 'Hittin'),
  ('Riyadh', 'الملز', 'Al Malaz'),
  ('Riyadh', 'السليمانية', 'Al Sulaimaniyah'),
  ('Riyadh', 'الروضة', 'Al Rawdah'),
  ('Riyadh', 'النخيل', 'Al Nakheel'),
  ('Riyadh', 'قرطبة', 'Qurtubah'),
  ('Jeddah', 'الشاطئ', 'Al Shati'),
  ('Jeddah', 'الروضة', 'Al Rawdah'),
  ('Jeddah', 'الزهراء', 'Al Zahra'),
  ('Jeddah', 'الصفا', 'Al Safa'),
  ('Jeddah', 'النعيم', 'Al Naeem'),
  ('Jeddah', 'السلامة', 'Al Salamah'),
  ('Jeddah', 'الحمراء', 'Al Hamra'),
  ('Dammam', 'الشاطئ', 'Al Shati'),
  ('Dammam', 'الفيصلية', 'Al Faisaliyah'),
  ('Dammam', 'النور', 'Al Noor'),
  ('Dammam', 'الجلوية', 'Al Jalawiyah')
) as v(city_name_en, name_ar, name_en) on c.name_en = v.city_name_en
where not exists (
  select 1 from districts d where d.city_id = c.id and d.name_en = v.name_en
);
