/** The سبعة logo (two stacked lines, سبعة above sbaah), from /public/brand-mark.png (700×304 source, ~2.3:1). Pass `invert` for the white-on-purple auth-panel usage — the mark is solid purple, so a CSS filter is enough, no separate white asset needed. */
export function BrandMark({
  width = 53,
  height = 23,
  invert = false,
}: {
  width?: number;
  height?: number;
  invert?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static PNG brand asset, no responsive/optimization needs
    <img
      src="/brand-mark.png"
      alt="سبعة"
      width={width}
      height={height}
      style={invert ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  );
}
