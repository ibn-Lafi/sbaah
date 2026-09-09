/** Route group for unauthenticated screens (just /login for now) — the page itself owns its full-page layout, this is a plain pass-through. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
