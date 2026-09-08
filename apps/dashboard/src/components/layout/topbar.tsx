interface TopbarProps {
  title: string;
}

/** Matches the mockup's topbar exactly: title, search pill, circular icon buttons. */
export function Topbar({ title }: TopbarProps) {
  return (
    <div className="flex h-[72px] flex-none items-center gap-4 border-b border-border-subtle bg-surface-card px-7">
      <div className="text-[19px] font-semibold text-text-primary">{title}</div>
      <div className="flex-1" />
      <div className="flex h-[42px] w-[280px] items-center gap-[10px] rounded-full bg-surface-card px-4 shadow-[0_1px_6px_rgba(31,29,34,.11)]">
        <span className="h-[14px] w-[14px] flex-none rounded-full border-[1.6px] border-text-secondary" />
        <input
          type="text"
          placeholder="بحث..."
          className="flex-1 border-none bg-transparent text-[13px] text-text-primary outline-none"
        />
      </div>
      <button
        type="button"
        aria-label="زيارة الموقع"
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-surface-subtle"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="#1F1D22" strokeWidth="1.7" className="h-[19px] w-[19px]">
          <path d="M14 4h6v6M10 14 20 4M13 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-6" />
        </svg>
      </button>
    </div>
  );
}
