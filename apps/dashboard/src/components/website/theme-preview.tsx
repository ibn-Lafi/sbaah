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
