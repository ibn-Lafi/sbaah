'use client';

import { createContext, useContext } from 'react';
import type { MeResponse } from '@/lib/api/console-auth';

interface CurrentAdminValue {
  admin: MeResponse['admin'];
  accessToken: string;
}

const CurrentAdminContext = createContext<CurrentAdminValue | null>(null);

export function CurrentAdminProvider({ value, children }: { value: CurrentAdminValue; children: React.ReactNode }) {
  return <CurrentAdminContext.Provider value={value}>{children}</CurrentAdminContext.Provider>;
}

export function useCurrentAdmin(): CurrentAdminValue {
  const value = useContext(CurrentAdminContext);
  if (!value) {
    throw new Error('useCurrentAdmin must be used within a CurrentAdminProvider');
  }
  return value;
}
