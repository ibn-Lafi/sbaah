/**
 * A tiny CSS mockup of each theme's homepage layout — not a real
 * screenshot (no rendering pipeline for that exists), but a genuine,
 * at-a-glance shape difference so "متجر الثيمات" isn't just a list of
 * names. Keyed by `theme.key`; an unknown future key (a theme added to
 * the DB before its registry entry ships) falls back to a generic
 * placeholder rather than breaking the gallery.
 */
export function ThemePreview({ themeKey, primaryColor }: { themeKey: string; primaryColor: string }) {
  if (themeKey === 'modern') {
    return (
      <div className="flex h-full w-full flex-col gap-1.5 bg-white p-2.5">
        <div className="grid flex-1 grid-cols-2 gap-1.5">
          <div className="flex flex-col justify-center gap-1 rounded" style={{ backgroundColor: `${primaryColor}1a` }}>
            <div className="mx-1.5 h-1.5 w-3/4 rounded-full" style={{ backgroundColor: primaryColor }} />
            <div className="mx-1.5 h-1 w-1/2 rounded-full bg-black/15" />
          </div>
          <div className="rounded" style={{ backgroundColor: primaryColor }} />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="aspect-square rounded bg-black/10" />
          <div className="aspect-square rounded bg-black/10" />
          <div className="aspect-square rounded bg-black/10" />
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
