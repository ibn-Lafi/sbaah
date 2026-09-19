'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

/** Matches apps/dashboard/src/components/ui/modal.tsx — every "+ ..." create flow (باقة/مدينة/حي) opens one of these on top of the current list page instead of navigating to a standalone /new route. */
export function Modal({ title, onClose, children, maxWidth = '720px' }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="bg-surface-card h-auto max-h-[calc(100dvh-16px)] w-full min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-[24px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-0 shadow-[0_20px_60px_rgba(31,29,34,.25)] [scrollbar-gutter:stable] sm:max-h-[90vh] sm:rounded-card sm:p-8"
        style={{ maxWidth }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-20 -mx-4 mb-4 flex min-w-0 items-center justify-between border-b border-border-subtle bg-surface-card/95 px-4 pb-3 pt-4 backdrop-blur sm:static sm:mx-0 sm:mb-5 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <h2 className="min-w-0 truncate pe-3 text-base font-semibold text-text-primary sm:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            title="إغلاق"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-control text-text-secondary hover:bg-surface-subtle"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-[18px] w-[18px]">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
