/**
 * سبعة's own "7" badge (the numeral مبعة uses in its own icon mark
 * elsewhere — console's header, the public site's SiteBadge — always in
 * Latin/English digit form, not Arabic-Indic "٧", matching those) as a
 * loading indicator: the badge sits still at the center while a thin
 * two-tone ring halo spins around it — reads as "سبعة is working on it",
 * not just a generic spinner, matching the branded feel of the
 * registration provisioning screen (ProvisioningOverlay) rather than a
 * plain ring. Sized generously by default — this is the loading state
 * itself, not a small decorative accent next to other content.
 */
export function BrandSpinner({ size = 48 }: { size?: number }) {
  const badgeSize = size * 0.62;
  return (
    <span className="relative inline-flex flex-none items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="absolute inset-0 h-full w-full animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="10.75" stroke="currentColor" strokeWidth="1.5" className="text-brand-surface-2" />
        <path
          d="M12 1.25a10.75 10.75 0 0 1 7.6 18.35"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-brand"
        />
      </svg>
      <span
        className="flex items-center justify-center rounded-full bg-brand font-bold text-white shadow-[0_2px_8px_rgba(104,69,138,.35)]"
        style={{ width: badgeSize, height: badgeSize, fontSize: badgeSize * 0.5 }}
      >
        7
      </span>
    </span>
  );
}
