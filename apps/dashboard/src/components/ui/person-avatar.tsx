import { useLocale } from '@/lib/i18n/locale-context';

/** Circular initial-letter avatar for a person's name (lead/team member), distinct from AccountAvatar (tenant/account-type icon). */
export function PersonAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const { pages } = useLocale();
  const letter = name.trim().charAt(0) || pages.common.unknownPersonInitial;
  return (
    <div
      className="flex flex-none items-center justify-center rounded-full bg-brand-surface font-semibold text-brand"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {letter}
    </div>
  );
}
