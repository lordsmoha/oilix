'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

export type SearchableClientOption = {
  clientId: string;
  clientNumber: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  totalWeightKg?: number;
  entryCount?: number;
};

type Props = {
  clients: SearchableClientOption[];
  value: string;
  onChange: (clientId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
};

export function SearchableClientPicker({
  clients,
  value,
  onChange,
  disabled,
  placeholder = 'ابحث بالرقم أو الاسم أو الهاتف…',
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = clients.find((c) => c.clientId === value);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clients;
    const compact = term.replace(/\s/g, '');
    return clients.filter((c) => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const phone = (c.phone ?? '').replace(/\s/g, '');
      return (
        String(c.clientNumber).includes(compact) ||
        name.includes(term) ||
        phone.includes(compact)
      );
    });
  }, [clients, q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQ('');
  }

  function clear() {
    onChange('');
    setQ('');
    setOpen(true);
    inputRef.current?.focus();
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Keeps native form required validation when embedded in forms */}
      <input type="hidden" value={value} required={required} readOnly />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-right text-sm transition',
          'hover:border-[var(--app-accent)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--app-accent)_35%,transparent)]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-[var(--app-text-dim)]" />
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-[var(--app-text-dim)]')}>
          {selected
            ? `${selected.clientNumber} — ${selected.firstName} ${selected.lastName}${
                selected.totalWeightKg != null
                  ? ` (${formatNumber(selected.totalWeightKg)} كغ)`
                  : ''
              }`
            : placeholder}
        </span>
        {selected ? (
          <span
            role="button"
            tabIndex={0}
            className="rounded-lg p-1 text-[var(--app-text-dim)] hover:bg-[var(--app-bg-muted)] hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                clear();
              }
            }}
            aria-label="مسح الاختيار"
          >
            <X className="h-4 w-4" />
          </span>
        ) : (
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-[var(--app-text-dim)]" />
        )}
      </button>

      {open && !disabled ? (
        <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[var(--app-shadow-lg)]">
          <div className="border-b border-[var(--app-border)] p-2">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="رقم الزبون · الاسم · الهاتف"
              className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-muted)] px-3 py-2 text-sm outline-none focus:border-[var(--app-accent)]"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-[var(--app-text-dim)]">
                لا نتائج
              </li>
            ) : (
              filtered.map((c) => {
                const active = c.clientId === value;
                return (
                  <li key={c.clientId}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pick(c.clientId)}
                      className={cn(
                        'flex w-full items-start gap-2 px-3 py-2.5 text-right text-sm transition hover:bg-[var(--app-bg-muted)]',
                        active && 'bg-[color-mix(in_srgb,var(--app-accent)_10%,transparent)]',
                      )}
                    >
                      <Check
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0 text-[var(--app-accent)]',
                          !active && 'opacity-0',
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-[var(--app-text)]">
                          <span className="font-mono tabular-nums">{c.clientNumber}</span>
                          {' — '}
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="mt-0.5 block text-xs text-[var(--app-text-dim)]">
                          {c.phone ? <span dir="ltr">{c.phone}</span> : 'بدون هاتف'}
                          {c.totalWeightKg != null
                            ? ` · ${formatNumber(c.totalWeightKg)} كغ`
                            : ''}
                          {c.entryCount && c.entryCount > 1 ? ` · ${c.entryCount} وزن` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
