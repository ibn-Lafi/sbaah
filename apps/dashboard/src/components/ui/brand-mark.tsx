/** Official Sbaah horizontal lockup. Size it by height and always preserve the SVG's native aspect ratio. */
export function BrandMark({
  width: _legacyWidth,
  height = 24,
  invert = false,
  className = '',
}: {
  /** @deprecated The official lockup is height-driven; retained for call-site compatibility. */
  width?: number;
  height?: number;
  invert?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset
    <img
      src={invert ? '/sbaah-lockup-white.svg' : '/sbaah-lockup-purple.svg'}
      alt="سبعة"
      height={height}
      className={`block h-auto max-w-full object-contain ${className}`}
      style={{ height, width: 'auto' }}
    />
  );
}

/** Compact standalone platform symbol for constrained UI surfaces. */
export function BrandIcon({ size = 28, tone = 'purple' }: { size?: number; tone?: 'purple' | 'white' | 'black' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset
    <img
      src={`/sbaah-icon-${tone}.svg`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className="block shrink-0 object-contain"
    />
  );
}
