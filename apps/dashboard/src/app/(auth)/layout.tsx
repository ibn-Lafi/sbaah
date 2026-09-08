import { AuthPanel } from '@/components/auth/auth-panel';

/** Shared shell for /login, /register, /forgot-password — no sidebar/topbar (AppShell is for authenticated screens only). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AuthPanel />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
}
