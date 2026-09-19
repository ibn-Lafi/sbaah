create table if not exists platform_faq_items (
  id uuid primary key default gen_random_uuid(),
  question_ar text not null,
  answer_ar text not null,
  question_en text not null,
  answer_en text not null,
  order_index integer not null default 0 check (order_index >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table platform_faq_items enable row level security;

drop policy if exists platform_faq_items_public_select on platform_faq_items;
create policy platform_faq_items_public_select on platform_faq_items
for select using (is_active = true);

create index if not exists platform_faq_items_order_idx
  on platform_faq_items (is_active, order_index);
