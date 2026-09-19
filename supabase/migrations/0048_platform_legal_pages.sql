alter table platform_settings
  add column privacy_title_ar text not null default 'سياسة الخصوصية',
  add column privacy_title_en text not null default 'Privacy Policy',
  add column privacy_content_ar text not null default '',
  add column privacy_content_en text not null default '',
  add column terms_title_ar text not null default 'الشروط والأحكام',
  add column terms_title_en text not null default 'Terms & Conditions',
  add column terms_content_ar text not null default '',
  add column terms_content_en text not null default '';
