/** The سبعة logo. Supports the white mark used on brand-colored navigation surfaces. */
export function BrandMark({
  width = 92,
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


/** Compact standalone platform symbol for constrained UI surfaces. */
export function BrandIcon({ size = 28, tone = 'purple' }: { size?: number; tone?: 'purple' | 'white' | 'black' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset
    <img src={`/sbaah-icon-${tone}.svg`} alt="" aria-hidden="true" width={size} height={size} />
  );
}
