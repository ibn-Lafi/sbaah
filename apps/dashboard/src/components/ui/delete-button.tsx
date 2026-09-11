'use client';

import { useState } from 'react';
import { Button } from './button';
import { Modal } from './modal';

interface DeleteButtonProps {
  /** نص الزر الصغير نفسه، مثال: "حذف العقار". */
  label: string;
  /** عنوان النافذة المنبثقة التأكيدية. */
  confirmTitle: string;
  /** نص التأكيد، مثال: "لا يمكن التراجع عن هذا الإجراء." */
  confirmMessage: string;
  onConfirm: () => Promise<void>;
  /** بلا أيقونة وبخط أصغر (text-xs) — لصفوف مدمجة بجانب أزرار أخرى بنفس الحجم (مثل "تعديل" بصفحة الصفحات). */
  compact?: boolean;
}

/**
 * زر حذف صغير (أيقونة + نص) بدل الزر الكبير القديم داخل بطاقة مستقلة —
 * يفتح نافذة منبثقة تأكيدية (بدل window.confirm) قبل تنفيذ الحذف.
 * مستخدَم في كل صفحات تفاصيل السجلات (عقار/عمارة/مشروع/إيجار/عميل محتمل).
 */
export function DeleteButton({ label, confirmTitle, confirmMessage, onConfirm, compact = false }: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر الحذف');
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 font-semibold text-danger hover:underline ${compact ? 'text-xs' : 'text-sm font-medium'}`}
      >
        {!compact && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M4 7h16" />
            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        )}
        {label}
      </button>

      {open && (
        <Modal title={confirmTitle} onClose={() => setOpen(false)} maxWidth="420px">
          <p className="mb-5 text-sm text-text-secondary">{confirmMessage}</p>
          {error && <p className="mb-4 text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={loading} onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="button" variant="danger" loading={loading} onClick={() => void handleConfirm()}>
              حذف نهائيًا
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
