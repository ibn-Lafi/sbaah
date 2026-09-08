/** The سبعة logo, from /public/brand-mark.svg. Pass `invert` for the white-on-purple auth-panel usage. */
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
    <img
      src="/brand-mark.svg"
      alt="سبعة"
      width={width}
      height={height}
      style={invert ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  );
}
