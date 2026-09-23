-- Replay drift: 0102's functions and the public projects API read
-- projects.slug, but no migration in this repository creates that column.
alter table projects add column if not exists slug text;
