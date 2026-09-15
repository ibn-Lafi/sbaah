'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/locale-context';
import { DuplicateIcon, EyeOffIcon, KebabIcon, TrashIcon } from './editor-icons';

interface SectionRowMenuProps {
  onHide: () => void;
  onDuplicate: () => void;
}

/**
 * قائمة إجراءات صف القسم بـ"محتوى الصفحة" (إخفاء/تكرار/حذف) — بديل عن
 * زر العين المشطوبة المباشر (طلب المؤسس، مرجع Zid). "إخفاء" و"حذف"
 * ينفّذان نفس الإجراء فعليًا (onHide): هذا المنتج لا يملك حذفًا نهائيًا
 * لقسم "منسّق" مسبقًا بقاعدة البيانات (migration 0024، فلسفة "منسّقة لا
 * كنفاس حر") — كلاهما يُعيد القسم لمكتبة "إضافة قسم"، غير نهائي أبدًا،
 * كما أكّد المؤسس صراحة عند توضيح المطلوب. عرضهما كبندين منفصلين مطابقة
 * للواجهة المرجعية، لا ازدواجية غير مقصودة.
 */
export function SectionRowMenu({ onHide, onDuplicate }: SectionRowMenuProps) {
  const { pages } = useLocale();
  const t = pages.website;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function run(action: () => void) {
    action();
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative flex-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.editor.sectionMenu}
        title={t.editor.sectionMenu}
        className="text-text-secondary hover:text-brand flex h-7 w-7 flex-none items-center justify-center"
      >
        <KebabIcon className="h-[16px] w-[16px]" />
      </button>
      {open && (
        <div
          role="menu"
          className="bg-surface-card border-border-default absolute end-0 top-full z-10 mt-1 flex w-44 flex-col overflow-hidden rounded-input border py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onHide)}
            className="text-text-primary hover:bg-surface-subtle flex w-full items-center gap-2 px-3 py-2 text-start text-sm"
          >
            <EyeOffIcon className="h-[15px] w-[15px]" />
            {t.editor.hideSection}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onDuplicate)}
            className="text-text-primary hover:bg-surface-subtle flex w-full items-center gap-2 px-3 py-2 text-start text-sm"
          >
            <DuplicateIcon className="h-[15px] w-[15px]" />
            {t.editor.duplicateSection}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onHide)}
            className="text-danger hover:bg-surface-subtle flex w-full items-center gap-2 px-3 py-2 text-start text-sm"
          >
            <TrashIcon className="h-[15px] w-[15px]" />
            {t.editor.deleteSection}
          </button>
        </div>
      )}
    </div>
  );
}
