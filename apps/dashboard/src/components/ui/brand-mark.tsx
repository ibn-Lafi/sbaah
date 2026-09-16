/** The سبعة logo (two stacked lines, سبعة above sbaah, ~2.27:1), from /public/brand-mark.svg — a real vector, sourced directly from the founder's design file. Pass `invert` for the white-on-purple auth-panel usage, which swaps in the dedicated white vector (/public/brand-mark-white.svg) rather than a CSS filter. */
export function BrandMark({
  width = 52,
  height = 23,
  invert = false,
}: {
  width?: number;
  height?: number;
  invert?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset, no responsive/optimization needs
    <img src={invert ? '/brand-mark-white.svg' : '/brand-mark.svg'} alt="سبعة" width={width} height={height} />
  );
}
