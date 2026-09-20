-- 0080: destructive cleanup of superseded physical real-estate tables.
-- Drop cross-schema storage policies that still reference legacy properties first.
drop policy if exists property_media_storage_agent_manage on storage.objects;
drop policy if exists property_media_storage_owner_admin_manage on storage.objects;
drop policy if exists property_media_storage_tenant_active_insert on storage.objects;
drop policy if exists property_media_storage_tenant_active_update on storage.objects;
drop policy if exists property_media_storage_tenant_active_delete on storage.objects;
drop policy if exists property_media_storage_public_select on storage.objects;

drop table if exists property_views;
drop table if exists property_media;
drop table if exists rentals;
drop table if exists units;
drop table if exists properties;
drop table if exists buildings;
