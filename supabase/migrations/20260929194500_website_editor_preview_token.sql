alter table website_editor_drafts add column if not exists preview_token uuid not null default gen_random_uuid();
create unique index if not exists website_editor_drafts_preview_token_uidx on website_editor_drafts(preview_token);
