-- Replay drift: 0104 changes public_listing_feed's OUT columns with CREATE OR
-- REPLACE, which Postgres rejects for the 0076 signature it replaces.
drop function if exists public_listing_feed(uuid,listing_type_v2,asset_type,uuid,uuid,numeric,numeric,integer,integer,integer);
