'use client';

import { useEffect, useRef, useState } from 'react';
import type { Website, WebsiteSection } from '@sbaah/shared';
import { EyeOffIcon } from './editor-icons';
import { useLocale } from '@/lib/i18n/locale-context';
import { reorderSections } from '@/lib/api/website';
import { SectionConfigEditor } from './section-config-editor';

interface SectionListProps {
  /** أقسام مُفعَّلة (ظاهرة) فقط — الإخفاء يُزيل القسم من هذه القائمة عائدًا لمكتبة "إضافة قسم" (onHide، مُدارة بصفحة المحرر نفسها ككل الأقسام معًا، بما فيها المخفية). */
  sections: WebsiteSection[];
  accessToken: string;
  onChange: (sections: WebsiteSection[]) => void;
  onHide: (section: WebsiteSection) => void;
  website: Website;
  onWebsiteUpdate: (website: Website) => void;
}

export const EDITABLE_TYPES: WebsiteSection['type'][] = ['hero', 'about', 'why_us', 'contact'];

/**
 * Native HTML5 drag-and-drop (no new dependency) — a plain vertical list
 * reorder doesn't need a full DnD library. Each drop persists the whole
 * new order in one call (sectionReorderSchema, PRODUCT_SPEC section 6).
 */
export function SectionList({ sections, accessToken, onChange, onHide, website, onWebsiteUpdate }: SectionListProps) {
  const { pages } = useLocale();
  const t = pages.website;
  const [ordered, setOrdered] = useState(sections);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  // "sections" يتغيّر من خارج هذا المكوّن أيضًا الآن (إضافة/إخفاء قسم من
  // صفحة المحرر نفسها، لا فقط بإعادة الترتيب الداخلية هنا) — لازم مزامنة
  // الحالة المحلية معه بدل الاكتفاء بالقيمة الأولية عند التركيب.
  useEffect(() => {
    setOrdered(sections);
  }, [sections]);

  function handleDrop(dropIndex: number) {
    if (dragIndex.current === null || dragIndex.current === dropIndex) return;
    const next = [...ordered];
    const [moved] = next.splice(dragIndex.current, 1);
    if (!moved) return;
    next.splice(dropIndex, 0, moved);
    setOrdered(next);
    dragIndex.current = null;

    void reorderSections(
      accessToken,
      next.map((section, index) => ({ id: section.id, order_index: index })),
    ).then((result) => onChange(result.sections));
  }

  function handleConfigSaved(updated: WebsiteSection) {
    const next = ordered.map((item) => (item.id === updated.id ? updated : item));
    setOrdered(next);
    onChange(next);
    setEditingId(null);
  }

  return (
    <div className="flex flex-col gap-2">
      {ordered.map((section, index) => (
        <div key={section.id} className="flex flex-col gap-2">
          <div
            draggable
            onDragStart={() => {
              dragIndex.current = index;
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="flex cursor-move items-center gap-3 rounded-input border border-border-default bg-surface-card px-4 py-3"
          >
            <span aria-hidden="true" className="text-text-placeholder">
              ⠿
            </span>
            <span className="flex-1 text-sm font-medium text-text-primary">{t.sectionTypeLabels[section.type]}</span>
            {section.type === 'footer' && <span className="text-xs text-text-secondary">{t.sectionList.footerBadgeNote}</span>}
            {EDITABLE_TYPES.includes(section.type) && (
              <button
                type="button"
                onClick={() => setEditingId(editingId === section.id ? null : section.id)}
                className="text-xs font-semibold text-brand hover:underline"
              >
                {editingId === section.id ? t.sectionList.closeEdit : t.sectionList.editContent}
              </button>
            )}
            <button
              type="button"
              onClick={() => onHide(section)}
              aria-label={t.editor.hideSection}
              title={t.editor.hideSection}
              className="text-text-secondary hover:text-danger flex-none"
            >
              <EyeOffIcon className="h-[16px] w-[16px]" />
            </button>
          </div>
          {editingId === section.id && (
            <SectionConfigEditor
              section={section}
              accessToken={accessToken}
              onSaved={handleConfigSaved}
              website={website}
              onWebsiteUpdate={onWebsiteUpdate}
            />
          )}
        </div>
      ))}
    </div>
  );
}
