-- Migration 0078: remove legacy CRM references after application cutover.
alter table lead_interests drop constraint if exists lead_interests_single_target_v2;
alter table viewings drop constraint if exists viewings_single_physical_target_transition;

alter table lead_interests
  drop column if exists property_id,
  drop column if exists unit_id;

alter table lead_interests
  add constraint lead_interests_single_target check (
    (project_id is not null)::int +
    (unit_type_id is not null)::int +
    (asset_id is not null)::int +
    (listing_id is not null)::int = 1
  );

alter table viewings
  alter column asset_id set not null,
  drop column if exists property_id,
  drop column if exists unit_id;

alter table deals
  drop column if exists property_id,
  drop column if exists unit_id;

alter table lead_requirements
  drop column if exists purpose,
  drop column if exists property_types;

alter table leads
  drop column if exists property_id;
