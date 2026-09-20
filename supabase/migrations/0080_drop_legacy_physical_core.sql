-- 0080: destructive cleanup of superseded physical real-estate tables.
-- Test data only; new source of truth is assets/listings.
drop table if exists property_views;
drop table if exists property_media;
drop table if exists rentals;
drop table if exists units;
drop table if exists properties;
drop table if exists buildings;
