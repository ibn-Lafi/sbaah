
-- إدخال المدن غير الموجودة فعليًا (مطابقة بالاسم العربي الدقيق) —
-- التكرارات الداخلية بمصدر البيانات نفسه (نحو 375 اسمًا) تُدخَل كصفوف
-- منفصلة أصلًا لأنها أماكن مختلفة فعليًا، ولا تتعارض مع هذا الشرط.
insert into cities (id, name_ar, name_en, lat, lng)
select s.seed_id, s.name_ar, s.name_en, s.lat, s.lng
from _seed_cities s
where not exists (select 1 from cities c where c.name_ar = s.name_ar);

-- تعبئة lat/lng لأي مدينة كانت موجودة مسبقًا (أُدخلت يدويًا) وبلا إحداثيات
update cities c
set lat = s.lat, lng = s.lng
from _seed_cities s
where c.name_ar = s.name_ar and c.lat is null and c.lng is null;

-- إدخال الأحياء — ربط المدينة عبر المعرّف الداخلي المولَّد أولًا (مطابقة
-- دقيقة 100% للمدن المُدرجة للتو)، وبالاسم كحل احتياطي فقط للمدن التي
-- كانت موجودة مسبقًا (حالة نادرة جدًا).
insert into districts (id, city_id, name_ar, name_en, lat, lng)
select
  sd.seed_id,
  coalesce(
    (select c.id from cities c where c.id = sd.city_seed_id),
    (select c.id from cities c where c.name_ar = sc.name_ar limit 1)
  ),
  sd.name_ar, sd.name_en, sd.lat, sd.lng
from _seed_districts sd
join _seed_cities sc on sc.seed_id = sd.city_seed_id
where coalesce(
    (select c.id from cities c where c.id = sd.city_seed_id),
    (select c.id from cities c where c.name_ar = sc.name_ar limit 1)
  ) is not null
  and not exists (
    select 1 from districts d
    where d.name_ar = sd.name_ar
      and d.city_id = coalesce(
        (select c.id from cities c where c.id = sd.city_seed_id),
        (select c.id from cities c where c.name_ar = sc.name_ar limit 1)
      )
  );

-- تعبئة lat/lng لأي حي كان موجودًا مسبقًا وبلا إحداثيات
update districts d
set lat = sd.lat, lng = sd.lng
from _seed_districts sd
where d.name_ar = sd.name_ar and d.lat is null and d.lng is null;

drop table _seed_cities;
drop table _seed_districts;
