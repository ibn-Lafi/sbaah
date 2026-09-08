/**
 * Static literal access only — Next.js inlines `NEXT_PUBLIC_*` vars into
 * the client bundle solely for direct `process.env.X` reads (task 24/42
 * found this the hard way), never through a dynamic-key helper.
 */
export function getPlatformRootDomain(): string {
  return process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? 'sbaah.app';
}
