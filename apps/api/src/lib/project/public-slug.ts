/**
 * Projects have no slug unless one was set outside the API (the dashboard
 * never sends one), and public-site builds `/projects/<slug>` links and its
 * canonical redirect from this value. `public_project_detail` accepts the id
 * as an identifier too, so it is the stable fallback.
 */
export function publicProjectSlug(project: { id: string; slug: string | null }): string {
  return project.slug?.trim() || project.id;
}
