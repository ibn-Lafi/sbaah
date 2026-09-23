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
    <img src={invert ? '/sbaah-lockup-white.svg' : '/sbaah-lockup-purple.svg'} alt="سبعة" width={width} height={height} />
  );
}


/** Compact standalone platform symbol for constrained UI surfaces. */
export function BrandIcon({ size = 28, tone = 'purple' }: { size?: number; tone?: 'purple' | 'white' | 'black' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset
    <img src={`/sbaah-icon-${tone}.svg`} alt="" aria-hidden="true" width={size} height={size} />
  );
}
