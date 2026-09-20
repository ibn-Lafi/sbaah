-- 0084: remove legacy polymorphic document ownership.
-- Preflight confirmed documents is empty; document_links is the canonical relationship model.

drop index if exists public.documents_tenant_owner_idx;

alter table public.documents
  drop column if exists owner_id,
  drop column if exists owner_type;

drop type if exists public.document_owner_type;
