alter table platform_settings
  add column if not exists hero_eyebrow_ar text,
  add column if not exists hero_eyebrow_en text,
  add column if not exists hero_title_ar text,
  add column if not exists hero_title_en text,
  add column if not exists hero_subtitle_ar text,
  add column if not exists hero_subtitle_en text,
  add column if not exists footer_tagline_ar text,
  add column if not exists footer_tagline_en text;
