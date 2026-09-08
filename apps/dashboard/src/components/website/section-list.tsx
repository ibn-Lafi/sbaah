'use client';

import { useRef, useState } from 'react';
import type { WebsiteSection } from '@sbaah/shared';
import { Switch } from '@/components/ui/switch';
import { updateSection, reorderSections } from '@/lib/api/website';
import { SECTION_TYPE_LABELS } from '@/lib/website/labels';

interface SectionListProps {
  sections: WebsiteSection[];
  accessToken: string;
  onChange: (sections: WebsiteSection[]) => void;
}

/**
 * Native HTML5 drag-and-drop (no new dependency) — a plain vertical list
 * reorder doesn't need a full DnD library. Each drop persists the whole
 * new order in one call (sectionReorderSchema, PRODUCT_SPEC section 6).
 */
export function SectionList({ sections, accessToken, onChange }: SectionListProps) {
  const [ordered, setOrdered] = useState(sections);
  const dragIndex = useRef<number | null>(null);

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

  async function handleToggle(section: WebsiteSection) {
    const next = ordered.map((item) => (item.id === section.id ? { ...item, is_visible: !item.is_visible } : item));
    setOrdered(next);
    const { section: updated } = await updateSection(accessToken, section.id, { is_visible: !section.is_visible });
    onChange(next.map((item) => (item.id === updated.id ? updated : item)));
  }

  return (
    <div className="flex flex-col gap-2">
      {ordered.map((section, index) => (
        <div
          key={section.id}
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
          <span className="flex-1 text-sm font-medium text-text-primary">{SECTION_TYPE_LABELS[section.type]}</span>
          {section.type === 'footer' && <span className="text-xs text-text-secondary">شارة سبعة تظهر دائمًا</span>}
          <Switch checked={section.is_visible} onChange={() => void handleToggle(section)} />
        </div>
      ))}
    </div>
  );
}
