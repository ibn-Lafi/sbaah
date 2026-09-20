-- 0085: remove final legacy project fields.
-- developer_party_id and planned_units_count are the canonical replacements.

alter table public.projects
  drop column if exists developer_name,
  drop column if exists total_units;
