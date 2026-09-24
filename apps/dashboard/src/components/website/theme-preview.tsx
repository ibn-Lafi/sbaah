/**
 * `previewImageUrl` (console-uploaded, migration 0035) wins when present —
 * a real screenshot beats a mockup. Falls back to a tiny CSS approximation
 * of each theme's homepage layout for a theme not yet screenshotted, so
 * "متجر الثيمات" still shows *some* shape difference rather than a blank
 * box. Keyed by `theme.key` for the fallback; an unknown future key (a
 * theme added to the DB before its registry entry ships) falls back to a
 * generic placeholder rather than breaking the gallery.
 */
export function ThemePreview({
  themeKey,
  primaryColor,
  previewImageUrl,
}: {
  themeKey: string;
  primaryColor: string;
  previewImageUrl?: string | null;
}) {
  if (previewImageUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, not a local/optimizable asset
    return <img src={previewImageUrl} alt="" className="h-full w-full object-cover" />;
  }

  if (themeKey === 'lavender') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#171713]">
        <div className="absolute inset-0 bg-gradient-to-br from-black/15 via-transparent to-black/80" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between border-b border-white/50 pb-2">
          <div className="h-2 w-14 rounded-full bg-white/90" />
          <div className="flex gap-2"><div className="h-1 w-6 rounded bg-white/60"/><div className="h-1 w-6 rounded bg-white/60"/></div>
        </div>
        <div className="absolute inset-x-3 bottom-4 border-t border-white/40 pt-3">
          <div className="h-2.5 w-3/4 rounded bg-white/90" />
          <div className="mt-2 h-1.5 w-1/2 rounded bg-white/55" />
        </div>
      </div>
    );
  }

  if (themeKey === 'classic') {
    return (
      <div className="flex h-full w-full flex-col gap-1.5 bg-white p-2.5">
        <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded" style={{ backgroundColor: primaryColor }}>
          <div className="h-1.5 w-1/2 rounded-full bg-white/90" />
          <div className="h-1 w-1/3 rounded-full bg-white/60" />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="aspect-[4/3] rounded bg-black/10" />
          <div className="aspect-[4/3] rounded bg-black/10" />
          <div className="aspect-[4/3] rounded bg-black/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-1.5 bg-surface-subtle p-2.5">
      <div className="h-1/2 rounded bg-black/10" />
      <div className="grid flex-1 grid-cols-3 gap-1">
        <div className="rounded bg-black/10" />
        <div className="rounded bg-black/10" />
        <div className="rounded bg-black/10" />
      </div>
    </div>
  );
}
