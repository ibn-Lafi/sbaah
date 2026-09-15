-- =============================================================================
-- Migration 0046: مناطق + مدن رئيسية منسّقة يدويًا (بدل الزحف الكامل 0045)
--
-- طلب المؤسس بعد رؤية نتيجة هجرة 0045: مصدر العنوان الوطني السعودي يصنّف
-- آلاف القرى/الهُجَر الصغيرة كـ"مدن" مستقلة (كل ما رآه المؤسس بجدول cities
-- كان أحياء/قرى صغيرة، لا مدنًا معروفة) — غير عملي كقائمة اختيار بنموذج
-- إضافة عقار. الحل هنا: هرمية جديدة من 3 مستويات بدل مستويين:
--   المنطقة (13 منطقة إدارية رسمية، ثابتة) -> المدينة (~65 مدينة رئيسية
--   منسّقة يدويًا، أحداثياتها من نفس مصدر 0045) -> الحي (يبقى فارغًا
--   عمدًا هنا؛ كل حي يُضاف لاحقًا من طرف الوسيط/المسوّق نفسه عبر تحديد
--   الموقع بالخريطة عند إضافة عقار، لا تعبئة جماعية من بيانات حكومية).
--
-- هذه الهجرة تحذف بالكامل كل ما أدخلته 0045 بجدولي cities/districts ثم
-- تُعيد بناءهما. المؤسس فحص قبل التشغيل ووجد 3 سجلات (عقار/مشروع/عمارة)
-- تُشير فعليًا لمدينة/حي من بيانات 0045 القديمة — city_id لا يقبل NULL
-- على الثلاثة، فحذف مباشر كان سيفشل بخطأ foreign key. لذا هذه النسخة
-- **تُعيد ربط تلك السجلات تلقائيًا** بدل الحذف الأعمى:
--   1. تأخذ لقطة (snapshot) من أسماء المدن/الأحياء القديمة قبل حذفها.
--   2. تُدرج المدن الجديدة المنسّقة.
--   3. تُعيد ربط كل عقار/مشروع/عمارة بالمدينة الجديدة التي تحمل *نفس
--      الاسم العربي* بالضبط (يعمل تلقائيًا طالما المدينة القديمة
--      المستخدمة كانت مدينة معروفة أصلًا — كالرياض/جدة/الدمام... —
--      وهي الحالة شبه المؤكدة لأي بيانات تجريبية حقيقية بهذه المرحلة).
--   4. تُفرغ district_id لتلك السجلات (عمودها يقبل NULL خلافًا لـcity_id)
--      لأن الأحياء القديمة تُحذف نهائيًا ولا تُستبدل بمقابل جديد — يعاد
--      اختيار/إضافة الحي يدويًا لاحقًا من نفس النموذج.
--   5. عندها فقط تُحذف المدن/الأحياء القديمة، فلا يبقى أي مرجع إليها.
--
-- **إن كانت إحدى الـ3 مدينة قديمة اسمها غير موجود بالقائمة الجديدة
-- أدناه** (قرية/حي صغير حقًا، لا مدينة معروفة) — ستفشل الخطوة الأخيرة
-- بخطأ foreign key بدل حذف صامت، وعندها أخبرني بالاسم الظاهر بالخطأ
-- لأضيفه للقائمة أو أعالجه يدويًا.
--
-- (لا جداول مؤقتة temp هنا عمدًا — محرر SQL بسوبابيس لا يضمن بقاءها بين
-- عبارات الملف نفسه، جرّبت ذلك فعليًا وفشل بخطأ "relation does not
-- exist". بدلًا منها: تمييز المدن القديمة عن الجديدة داخل جدول cities
-- نفسه عبر region_id — فارغ للقديمة إلى أن تُحذف، مضبوط للجديدة فور
-- إدراجها.)
-- =============================================================================

-- الملف كله معاملة واحدة (begin/commit): فشل أي خطوة (كخطأ foreign key
-- بالخطوة الأخيرة) يتراجع عن كل شيء تلقائيًا — لا حالة وسطى (مناطق/مدن
-- جديدة مُدرجة لكن قديمة لم تُحذف بعد) تبقى بقاعدة البيانات.
begin;

-- ---------------------------------------------------------------------------
-- regions — بيانات مرجعية ثابتة على مستوى المنصة (كالمدن)، لا شاشة إدارة
-- لها بـconsole عمدًا: 13 منطقة إدارية رسمية لا تتغير عمليًا.
-- ---------------------------------------------------------------------------
create table regions (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null
);

alter table cities add column region_id uuid references regions (id);

alter table regions enable row level security;

create policy regions_public_select on regions for select to anon, authenticated using (true);
create policy regions_admin_write on regions for all to authenticated
  using (is_platform_admin()) with check (is_platform_admin());

-- كل مستخدم تابع لمستأجر (وسيط/مسوّق مصرّح له بالدخول) يمكنه إضافة حي
-- جديد بنفسه عند إضافة عقار (عبر الخريطة) — إبقاء التحديث/الحذف
-- والمدن/المناطق حصرًا على المؤسس عبر console (السياسات القائمة).
create policy districts_tenant_insert on districts for insert to authenticated with check (true);

insert into regions (name_ar, name_en) values
  ('الرياض', 'Riyadh'),
  ('مكة المكرمة', 'Makkah'),
  ('المدينة المنورة', 'Madinah'),
  ('المنطقة الشرقية', 'Eastern Province'),
  ('القصيم', 'Al Qassim'),
  ('عسير', 'Aseer'),
  ('تبوك', 'Tabuk'),
  ('حائل', 'Hail'),
  ('الحدود الشمالية', 'Northern Borders'),
  ('جازان', 'Jazan'),
  ('نجران', 'Najran'),
  ('الباحة', 'Al Bahah'),
  ('الجوف', 'Al Jouf');

-- الإحداثيات وname_en هنا من نفس مصدر هجرة 0045 (SPL National Address).
insert into cities (name_ar, name_en, lat, lng, region_id) values
  ('الرياض', 'Riyadh', 24.69999996, 46.73333003, (select id from regions where name_ar = 'الرياض')),
  ('الخرج', 'Al Kharj', 24.15869998, 47.32695995, (select id from regions where name_ar = 'الرياض')),
  ('الدوادمي', 'Ad Duwadimi', 24.50127995, 44.38113994, (select id from regions where name_ar = 'الرياض')),
  ('المجمعة', 'Al Majma''ah', 25.90742996, 45.33901994, (select id from regions where name_ar = 'الرياض')),
  ('الزلفي', 'Az Zulfi', 26.29711002, 44.80577002, (select id from regions where name_ar = 'الرياض')),
  ('وادي الدواسر', 'Wadi Ad Dawasir', 20.46967996, 44.78301002, (select id from regions where name_ar = 'الرياض')),
  ('عفيف', 'Afif', 23.90952998, 42.92142996, (select id from regions where name_ar = 'الرياض')),
  ('القويعية', 'Al Quway''iyah', 23.40474001, 41.25960001, (select id from regions where name_ar = 'الرياض')),
  ('حوطة بني تميم', 'Hawtat Bani Tamim', 23.49761003, 46.86429996, (select id from regions where name_ar = 'الرياض')),
  ('الافلاج', 'Al Aflaj', 22.306935, 47.16373416, (select id from regions where name_ar = 'الرياض')),

  ('مكة المكرمة', 'Makkah', 21.42717994, 39.84349001, (select id from regions where name_ar = 'مكة المكرمة')),
  ('جدة', 'Jeddah', 21.48817996, 39.18094995, (select id from regions where name_ar = 'مكة المكرمة')),
  ('الطائف', 'At Taif', 21.26848005, 40.41667003, (select id from regions where name_ar = 'مكة المكرمة')),
  ('رابغ', 'Rabigh', 22.79374001, 39.03445994, (select id from regions where name_ar = 'مكة المكرمة')),
  ('القنفذة', 'Al Qunfidhah', 19.12722996, 41.09060996, (select id from regions where name_ar = 'مكة المكرمة')),
  ('الليث', 'Al Lith', 20.15267003, 40.27223003, (select id from regions where name_ar = 'مكة المكرمة')),
  ('الجموم', 'Al Jumum', 21.61476996, 39.69689997, (select id from regions where name_ar = 'مكة المكرمة')),
  ('خليص', 'Khulays', 22.155, 39.33763333, (select id from regions where name_ar = 'مكة المكرمة')),

  ('المدينة المنورة', 'Madinah', 24.47057996, 39.60781006, (select id from regions where name_ar = 'المدينة المنورة')),
  ('ينبع', 'Yanbu', 24.09391997, 38.06336005, (select id from regions where name_ar = 'المدينة المنورة')),
  ('العلا', 'Al Ula', 26.63478003, 37.90992002, (select id from regions where name_ar = 'المدينة المنورة')),
  ('بدر', 'Badr', 23.78301006, 38.79495005, (select id from regions where name_ar = 'المدينة المنورة')),
  ('مهد الذهب', 'Mahd Adh Dhahab', 23.50622995, 40.89206994, (select id from regions where name_ar = 'المدينة المنورة')),

  ('الدمام', 'Dammam', 26.44199002, 50.10919981, (select id from regions where name_ar = 'المنطقة الشرقية')),
  ('الخبر', 'Al Khobar', 26.31090997, 50.21074975, (select id from regions where name_ar = 'المنطقة الشرقية')),
  ('الظهران', 'Dhahran', 26.30357996, 50.12261974, (select id from regions where name_ar = 'المنطقة الشرقية')),
  ('الجبيل', 'Al Jubail', 26.99921004, 49.67046985, (select id from regions where name_ar = 'المنطقة الشرقية')),
  ('القطيف', 'Al Qatif', 26.56387002, 50.00120987, (select id from regions where name_ar = 'المنطقة الشرقية')),
  ('الهفوف', 'Al Hafuf', 25.36655003, 49.60435986, (select id from regions where name_ar = 'المنطقة الشرقية')),
  ('حفر الباطن', 'Hafar Al Batin', 28.43750001, 45.98046997, (select id from regions where name_ar = 'المنطقة الشرقية')),
  ('الخفجي', 'Al Khafji', 28.43980997, 48.49033999, (select id from regions where name_ar = 'المنطقة الشرقية')),
  ('راس تنورة', 'Ras Tannurah', 26.70673998, 50.07245984, (select id from regions where name_ar = 'المنطقة الشرقية')),
  ('النعيرية', 'An Nu''ayriyah', 27.47569997, 48.47742996, (select id from regions where name_ar = 'المنطقة الشرقية')),

  ('بريدة', 'Buraidah', 26.33033999, 43.97435997, (select id from regions where name_ar = 'القصيم')),
  ('عنيزة', 'Unayzah', 26.09155002, 43.98767004, (select id from regions where name_ar = 'القصيم')),
  ('الرس', 'Ar Rass', 25.87025999, 43.50747996, (select id from regions where name_ar = 'القصيم')),
  ('البكيرية', 'Al Bukayriyah', 26.14888995, 43.65727004, (select id from regions where name_ar = 'القصيم')),
  ('المذنب', 'Al Midhnab', 25.86073, 44.22219004, (select id from regions where name_ar = 'القصيم')),

  ('ابها', 'Abha', 18.21667, 42.50000002, (select id from regions where name_ar = 'عسير')),
  ('خميس مشيط', 'Khamis Mushayt', 18.30613002, 42.72976998, (select id from regions where name_ar = 'عسير')),
  ('بيشة', 'Bishah', 18.37224002, 42.65382004, (select id from regions where name_ar = 'عسير')),
  ('النماص', 'An Namas', 19.12173995, 42.13678004, (select id from regions where name_ar = 'عسير')),
  ('محايل', 'Muhayil', 18.54434004, 42.04321, (select id from regions where name_ar = 'عسير')),
  ('ظهران الجنوب', 'Dhahran Al Janub', 17.66975999, 43.50987006, (select id from regions where name_ar = 'عسير')),

  ('تبوك', 'Tabuk', 28.41463997, 36.53387003, (select id from regions where name_ar = 'تبوك')),
  ('الوجه', 'Al Wajh', 26.24021994, 36.47300001, (select id from regions where name_ar = 'تبوك')),
  ('ضبا', 'Duba', 27.36211995, 35.68198997, (select id from regions where name_ar = 'تبوك')),
  ('تيماء', 'Tayma''', 27.63502, 38.55060002, (select id from regions where name_ar = 'تبوك')),
  ('حقل', 'Haql', 29.30102998, 34.94863003, (select id from regions where name_ar = 'تبوك')),

  ('حائل', 'Hail', 27.53054999, 41.69733002, (select id from regions where name_ar = 'حائل')),
  ('بقعاء', 'Baq''a', 27.91023996, 42.40918005, (select id from regions where name_ar = 'حائل')),

  ('عرعر', 'Arar', 30.97214998, 41.01332997, (select id from regions where name_ar = 'الحدود الشمالية')),
  ('رفحاء', 'Rafha''', 29.63723002, 43.49903001, (select id from regions where name_ar = 'الحدود الشمالية')),
  ('طريف', 'Turaif', 31.68193994, 38.65750003, (select id from regions where name_ar = 'الحدود الشمالية')),

  ('جازان', 'Jazan', 16.89671995, 42.55360001, (select id from regions where name_ar = 'جازان')),
  ('صبيا', 'Sabya', 17.14780001, 42.63250999, (select id from regions where name_ar = 'جازان')),
  ('ابو عريش', 'Abu Arish', 16.96509999, 42.83113998, (select id from regions where name_ar = 'جازان')),
  ('صامطة', 'Samtah', 16.60519001, 42.94083001, (select id from regions where name_ar = 'جازان')),

  ('نجران', 'Najran', 17.5408618, 44.2663834, (select id from regions where name_ar = 'نجران')),
  ('شرورة', 'Sharurah', 17.4997518, 47.18864332, (select id from regions where name_ar = 'نجران')),

  ('الباحة', 'Bahah', 20.00695006, 41.46314, (select id from regions where name_ar = 'الباحة')),
  ('بلجرشي', 'Biljurashi', 19.84112005, 41.56252003, (select id from regions where name_ar = 'الباحة')),

  ('سكاكا', 'Sakaka', 29.9728, 40.21416997, (select id from regions where name_ar = 'الجوف')),
  ('القريات', 'Al Qurayyat', 31.35133999, 37.33972993, (select id from regions where name_ar = 'الجوف')),
  ('دومة الجندل', 'Dawmat Al Jandal', 29.81786995, 39.86566997, (select id from regions where name_ar = 'الجوف'));

-- ---------------------------------------------------------------------------
-- إعادة ربط أي عقار/مشروع/عمارة حقيقي كان يشير لمدينة/حي من 0045 القديمة
-- (بالاسم العربي المطابق تمامًا)، ثم حذف القديم بأمان — بالترتيب الموضّح
-- بتعليق رأس الملف. district_id يُفرَّغ (NULL) بدل إعادة ربطه: لا مقابل
-- جديد للأحياء القديمة، ويُعاد اختياره يدويًا لاحقًا من نفس النموذج.
-- ---------------------------------------------------------------------------
update properties p
set city_id = new_c.id
from cities old_c
join cities new_c on new_c.name_ar = old_c.name_ar and new_c.region_id is not null
where old_c.region_id is null and p.city_id = old_c.id;

update projects pr
set city_id = new_c.id
from cities old_c
join cities new_c on new_c.name_ar = old_c.name_ar and new_c.region_id is not null
where old_c.region_id is null and pr.city_id = old_c.id;

update buildings b
set city_id = new_c.id
from cities old_c
join cities new_c on new_c.name_ar = old_c.name_ar and new_c.region_id is not null
where old_c.region_id is null and b.city_id = old_c.id;

-- كل الأحياء الحالية (قبل هذا السطر) قديمة بالضرورة — لم يُدرَج أي حي
-- جديد بهذه الهجرة بعد. إفراغ المرجع قبل حذفها لأن district_id يقبل
-- NULL خلافًا لـcity_id.
update properties set district_id = null where district_id is not null;
update projects set district_id = null where district_id is not null;
update buildings set district_id = null where district_id is not null;

delete from districts;
delete from cities where region_id is null;

alter table cities alter column region_id set not null;

commit;
