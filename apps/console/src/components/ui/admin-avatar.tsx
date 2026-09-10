/** Circular avatar for the platform admin — always brand purple (no account-type concept here, unlike dashboard's AccountAvatar which is colored per tenant). */
export function AdminAvatar({ size = 32 }: { size?: number }) {
  return (
    <div className="flex flex-none items-center justify-center rounded-full bg-brand" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="text-white" style={{ width: size * 0.53, height: size * 0.53 }}>
        <circle cx="12" cy="8.2" r="3.6" />
        <path d="M4.5 20c0-4 3.4-6.6 7.5-6.6s7.5 2.6 7.5 6.6" />
      </svg>
    </div>
  );
}
