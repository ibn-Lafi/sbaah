-- Replay drift: project_media_public_select (migration 0064) depends on
-- projects.status, which blocks 0082's column type change. It is dropped
-- here and restored unchanged by the matching .post.sql.
drop policy if exists project_media_public_select on project_media;
