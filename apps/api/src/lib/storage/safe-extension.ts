/**
 * Security audit finding: every upload route derived the storage object's
 * file extension from `file.name.split('.').pop()` — a value the browser
 * sends as-is from the client, never validated. RLS on `storage.objects`
 * (migration 0011) already fences the object path to the caller's own
 * tenant/property, so this was never an escape from that fence, but it
 * still let an authenticated caller put path-like text (`.`, `/`) into an
 * object key. Deriving the extension from the already-validated MIME type
 * instead removes user-controlled text from the path entirely.
 */
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export function safeExtensionFromMime(mimeType: string): string {
  return MIME_EXTENSIONS[mimeType] ?? 'bin';
}
