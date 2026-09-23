-- Replay drift: migration 0009 already created projects_public_select, and
-- 0061 creates it again without dropping it first, so 0061 cannot run on a
-- database built from this repository. Production's actual state is unknown.
drop policy if exists projects_public_select on projects;
