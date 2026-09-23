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
    <img src={invert ? '/sbaah-lockup-white.svg' : '/sbaah-lockup-purple.svg'} alt="سبعة" width={width} height={height} />
  );
}
