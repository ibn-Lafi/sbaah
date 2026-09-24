'use client';

import { RuntimeErrorState } from '@/components/system/error-state';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RuntimeErrorState reset={reset} />;
}
