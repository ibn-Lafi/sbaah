'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from './input';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  /** Shows a "×" to reset to no selection — for optional fields (district/project/building/agent). */
  clearable?: boolean;
}

/**
 * Type-to-filter replacement for a plain `Select` when the option list is
 * too long to scan in a native dropdown — cities (4581 rows, migration
 * 0045) being the case that forced this. Keeps the same value/onChange
 * shape as `Select` so it drops into existing forms unchanged.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  clearable = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? '';

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  /** Flips the list above the field when a modal's scroll clipping (not the viewport itself) would otherwise cut it off below. */
  function openDropdown() {
    setOpen(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setOpenUpward(window.innerHeight - rect.bottom < 260);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
    : options;

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={open ? query : selectedLabel}
        onChange={(event) => {
          setQuery(event.target.value);
          openDropdown();
        }}
        onFocus={() => {
          setQuery('');
          openDropdown();
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        style={clearable && value && !open ? { paddingInlineEnd: '2.75rem' } : undefined}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            setQuery('');
            event.currentTarget.blur();
          }
        }}
      />
      {clearable && value && !open && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="إزالة الاختيار"
          className="text-text-secondary hover:text-text-primary absolute end-3 top-1/2 -translate-y-1/2 text-base"
        >
          ×
        </button>
      )}
      {open && !disabled && (
        <div
          className={`rounded-card bg-surface-card border-border-default absolute z-20 max-h-60 w-full overflow-y-auto border shadow-[0_8px_24px_rgba(31,29,34,.15)] ${
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {filteredOptions.length === 0 ? (
            <p className="text-text-secondary px-4 py-3 text-sm">لا نتائج</p>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  setQuery('');
                }}
                className={`hover:bg-surface-subtle block w-full px-4 py-2 text-right text-sm ${
                  option.value === value ? 'bg-surface-subtle font-medium' : ''
                }`}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
