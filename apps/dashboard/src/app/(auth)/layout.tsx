import { AuthPanel } from '@/components/auth/auth-panel';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ThemeToggle } from '@/components/layout/theme-toggle';

/**
 * Shared shell for /login, /register, /forgot-password — no sidebar/topbar
 * (AppShell is for authenticated screens only), so the language/theme
 * toggles that live in the topbar for authenticated pages get their own
 * fixed corner spot here instead — same order (theme, then language) as
 * the topbar, `variant="surface"` since there's no purple header behind
 * them on these pages.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="fixed end-4 top-4 z-10 flex items-center gap-2">
        <ThemeToggle variant="surface" />
        <LanguageToggle variant="surface" />
      </div>
      <AuthPanel />
      <div className="flex min-w-0 flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
}
