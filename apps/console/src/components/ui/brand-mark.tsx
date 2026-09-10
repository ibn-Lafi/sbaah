/** The سبعة logo, from /public/brand-mark.svg. Matches apps/dashboard/src/components/ui/brand-mark.tsx exactly. */
export function BrandMark({ width = 92, height = 23 }: { width?: number; height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset, no responsive/optimization needs
    <img src="/brand-mark.svg" alt="سبعة" width={width} height={height} />
  );
}
