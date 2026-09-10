/**
 * سبعة's own "٧" badge (the same circular mark used elsewhere — console's
 * header, AccountAvatar-adjacent chrome) as a loading indicator: the
 * badge sits still at the center while a thin two-tone ring halo spins
 * around it — reads as "سبعة is working on it", not just a generic
 * spinner, matching the branded feel of the registration provisioning
 * screen (ProvisioningOverlay) rather than a plain ring.
 */
export function BrandSpinner({ size = 20 }: { size?: number }) {
  const badgeSize = size * 0.6;
  return (
    <span className="relative inline-flex flex-none items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 h-full w-full animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="2" className="text-brand-surface-2" />
        <path
          d="M12 1.5a10.5 10.5 0 0 1 7.42 17.92"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-brand"
        />
      </svg>
      <span
        className="flex items-center justify-center rounded-full bg-brand font-bold leading-none text-white"
        style={{ width: badgeSize, height: badgeSize, fontSize: badgeSize * 0.56 }}
      >
        ٧
      </span>
    </span>
  );
}
