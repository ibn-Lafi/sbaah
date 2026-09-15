'use client';

import { useState } from 'react';
import { Button } from './button';
import { Modal } from './modal';
import { useLocale } from '@/lib/i18n/locale-context';

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
 * زر حذف معبّأ بلون الخطر (كبسولة حمراء بلا أيقونة) — يفتح نافذة منبثقة
 * تأكيدية (بدل window.confirm) قبل تنفيذ الحذف. الشكل مطابق لنمط "Alert
 * Dialog" التدميري الشائع (مثل c-alert-dialog-5 من REUI) لكن بألوان
 * هويتنا (danger-surface/danger) بدل لون REUI الافتراضي، ونص عام "حذف"
 * فقط بدل اسم الكيان — سياق الكيان يبقى داخل نافذة التأكيد نفسها
 * (confirmTitle/confirmMessage). مستخدَم في كل صفحات تفاصيل السجلات
 * (عقار/عمارة/مشروع/إيجار/عميل محتمل) وصفحة "الصفحات".
 */
export function DeleteButton({ label, confirmTitle, confirmMessage, onConfirm, compact = false }: DeleteButtonProps) {
  const { pages } = useLocale();
  const t = pages.common;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.deleteFailed);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`bg-danger-surface text-danger hover:bg-danger inline-flex w-fit flex-none items-center justify-center self-start rounded-full font-semibold transition-colors hover:text-white ${
          compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'
        }`}
      >
        {label}
      </button>

      {open && (
        <Modal title={confirmTitle} onClose={() => setOpen(false)} maxWidth="420px">
          <p className="mb-5 text-sm text-text-secondary">{confirmMessage}</p>
          {error && <p className="mb-4 text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={loading} onClick={() => setOpen(false)}>
              {t.cancel}
            </Button>
            <Button type="button" variant="danger" loading={loading} onClick={() => void handleConfirm()}>
              {t.deletePermanently}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
