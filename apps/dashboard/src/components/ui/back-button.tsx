function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

interface BackButtonProps {
  href: string;
  /** يُستهلك عبر aria-label/title فقط — الزر أيقونة بلا نص ظاهر، مطابقةً لمرجع المؤسس. */
  label: string;
  className?: string;
}

/** زر رجوع دائري بسهم مستقيم (يشير يمينًا — اتجاه "الرجوع" بقراءة RTL) — دائرة بحدود فاتحة وخلفية بيضاء، بلا نص. مستخدَم بكل صفحة تحتوي رابط رجوع (تفاصيل العميل المحتمل، تخصيص الثيم، اختيار الباقة). */
export function BackButton({ href, label, className = '' }: BackButtonProps) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className={`border-border-default bg-surface-card text-text-primary hover:bg-surface-subtle flex h-11 w-11 flex-none items-center justify-center rounded-full border transition-colors ${className}`}
    >
      <ArrowRightIcon className="h-5 w-5" />
    </a>
  );
}
