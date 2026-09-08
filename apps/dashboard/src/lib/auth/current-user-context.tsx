'use client';

import { createContext, useContext } from 'react';
import type { MeResponse } from '@/lib/api/auth';

export interface CurrentUser {
  me: MeResponse;
  accessToken: string;
}

const CurrentUserContext = createContext<CurrentUser | null>(null);

export const CurrentUserProvider = CurrentUserContext.Provider;

/** Every page under app/(app)/ reads the session's owner/tenant this way instead of re-fetching GET /v1/auth/me itself — (app)/layout.tsx fetches it once. */
export function useCurrentUser(): CurrentUser {
  const value = useContext(CurrentUserContext);
  if (!value) {
    throw new Error('useCurrentUser must be used within (app)/layout.tsx');
  }
  return value;
}
