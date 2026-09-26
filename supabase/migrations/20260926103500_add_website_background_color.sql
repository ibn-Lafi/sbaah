-- Theme surface token: owner-controlled site/page background.
alter table public.websites
  add column if not exists background_color text not null default '#F4F1EA';

alter table public.websites
  drop constraint if exists websites_background_color_hex_check;

alter table public.websites
  add constraint websites_background_color_hex_check
  check (background_color ~ '^#[0-9A-Fa-f]{6}$');
