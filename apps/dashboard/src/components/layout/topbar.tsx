interface TopbarProps {
  title: string;
  siteUrl: string;
}

/** Matches the mockup's topbar exactly on desktop; below md the search pill hides (bottom nav's page list covers navigation there) and spacing/sizes shrink so the title + visit-site button always fit a phone screen without wrapping. */
export function Topbar({ title, siteUrl }: TopbarProps) {
  return (
    <div className="border-border-subtle bg-surface-card flex h-14 flex-none items-center gap-2 border-b px-4 md:h-[72px] md:gap-4 md:px-7">
      <div className="text-text-primary min-w-0 flex-1 truncate text-[16px] font-semibold md:flex-none md:text-[19px]">
        {title}
      </div>
      <div className="hidden flex-1 md:block" />
      <div className="bg-surface-card hidden h-[42px] w-[280px] items-center gap-[10px] rounded-full px-4 shadow-[0_1px_6px_rgba(31,29,34,.11)] md:flex">
        <span className="border-text-secondary h-[14px] w-[14px] flex-none rounded-full border-[1.6px]" />
        <input
          type="text"
          placeholder="بحث..."
          className="text-text-primary flex-1 border-none bg-transparent text-[13px] outline-none"
        />
      </div>
      <a
        href={siteUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="زيارة الموقع"
        title="زيارة الموقع"
        className="bg-surface-subtle flex h-9 w-9 flex-none items-center justify-center rounded-full md:h-[42px] md:w-[42px]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1F1D22"
          strokeWidth="1.7"
          className="h-[17px] w-[17px] md:h-[19px] md:w-[19px]"
        >
          <path d="M14 4h6v6M10 14 20 4M13 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-6" />
        </svg>
      </a>
    </div>
  );
}
