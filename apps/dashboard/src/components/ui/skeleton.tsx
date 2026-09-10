import type { CSSProperties } from 'react';

/** Base pulsing placeholder block — every skeleton-loading layout in the app is built from these. */
export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-md bg-surface-subtle-3 ${className}`} style={style} />;
}
