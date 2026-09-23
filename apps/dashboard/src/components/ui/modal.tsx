'use client';

import { useEffect, type ReactNode } from 'react';
import { useLocale } from '@/lib/i18n/locale-context';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  mobileCentered?: boolean;
}

/** Every "+ إضافة ..." flow (عقار/عمارة/مشروع/إيجار/عميل محتمل/عضو) opens one of these on top of the current list page instead of navigating to a standalone /new route. */
export function Modal({ title, onClose, children, maxWidth = '720px', mobileCentered = false }: ModalProps) {
  const { pages } = useLocale();
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow=previousOverflow; };
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-[120] flex justify-center bg-black/40 backdrop-blur-[2px] ${mobileCentered ? 'items-center p-3 sm:p-4' : 'items-end p-0 sm:items-center sm:p-4'}`}
      onClick={onClose}
    >
      <div
        className={`bg-surface-card w-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain shadow-[0_20px_60px_rgba(31,29,34,.25)] [scrollbar-gutter:stable] ${mobileCentered ? 'max-h-[calc(100dvh-24px)] rounded-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-0 sm:max-h-[90vh] sm:p-8' : 'h-[calc(100dvh-8px)] max-h-[calc(100dvh-8px)] rounded-t-[24px] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-0 sm:h-auto sm:max-h-[90vh] sm:rounded-card sm:p-8'}`}
        style={{ maxWidth }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-20 -mx-4 mb-4 flex min-w-0 items-center justify-between border-b border-border-subtle bg-surface-card/95 px-4 pb-3 pt-4 backdrop-blur sm:static sm:mx-0 sm:mb-5 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <h2 className="text-text-primary min-w-0 truncate pe-3 text-base font-semibold sm:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={pages.common.close}
            title={pages.common.close}
            className="rounded-control text-text-secondary hover:bg-surface-subtle flex h-8 w-8 flex-none items-center justify-center"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              className="h-[18px] w-[18px]"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
