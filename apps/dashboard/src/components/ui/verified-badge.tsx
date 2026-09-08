import { ACCOUNT_TYPE_BADGE_COLOR, type AccountType } from '@sbaah/shared';

/**
 * The سبعة verification mark, colored by account type. PRODUCT_SPEC
 * section 6: this reflects account_type only, never an actual license
 * check — copy near it must say so, not imply real verification.
 */
export function VerifiedBadge({ accountType, size = 44 }: { accountType: AccountType; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="verified"
      style={{ width: size, height: size, color: ACCOUNT_TYPE_BADGE_COLOR[accountType] }}
    >
      <path
        d="M50.00 2.00L59.96 12.81L74.00 8.43L77.22 22.78L91.57 26.00L87.19 40.04L98.00 50.00L87.19 59.96L91.57 74.00L77.22 77.22L74.00 91.57L59.96 87.19L50.00 98.00L40.04 87.19L26.00 91.57L22.78 77.22L8.43 74.00L12.81 59.96L2.00 50.00L12.81 40.04L8.43 26.00L22.78 22.78L26.00 8.43L40.04 12.81Z"
        fill="currentColor"
      />
      <path
        d="M31.5 52 L44.5 64.5 L69 37.5"
        fill="none"
        stroke="#fff"
        strokeWidth="9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
