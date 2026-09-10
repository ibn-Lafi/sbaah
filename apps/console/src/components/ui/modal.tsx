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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full overflow-auto rounded-card bg-surface-card p-8 shadow-[0_20px_60px_rgba(31,29,34,.25)]"
        style={{ maxWidth }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
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
