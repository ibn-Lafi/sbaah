import { BrandSpinner } from './brand-spinner';

/** The one true "loading the whole page" moment (the auth-guard in (app)/layout.tsx, before AppShell exists yet) — a bigger, centered BrandSpinner, same calm composition as the registration flow's ProvisioningOverlay. */
export function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page">
      <BrandSpinner size={72} />
    </div>
  );
}
