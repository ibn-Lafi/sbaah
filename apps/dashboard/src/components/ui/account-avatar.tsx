import { ACCOUNT_TYPE_BADGE_COLOR, type AccountType } from '@sbaah/shared';

/** Circular avatar colored by account type — same palette as the سبعة footer badge (PRODUCT_SPEC section 6). */
export function AccountAvatar({ accountType, size = 32 }: { accountType: AccountType; size?: number }) {
  return (
    <div
      className="flex flex-none items-center justify-center rounded-full"
      style={{ width: size, height: size, background: ACCOUNT_TYPE_BADGE_COLOR[accountType] }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="text-white" style={{ width: size * 0.53, height: size * 0.53 }}>
        <circle cx="12" cy="8.2" r="3.6" />
        <path d="M4.5 20c0-4 3.4-6.6 7.5-6.6s7.5 2.6 7.5 6.6" />
      </svg>
    </div>
  );
}
