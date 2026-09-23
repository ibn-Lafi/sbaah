-- Replay drift: broker_marketer_applications.property_id (migration 0032)
-- still references properties, so 0080's DROP TABLE properties fails.
alter table broker_marketer_applications drop constraint if exists broker_marketer_applications_property_id_fkey;
