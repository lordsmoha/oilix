'use client';

import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Field = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

type Props = {
  fields: Field[];
  onSearch: () => void;
  matchCount?: number;
  matchIndex?: number;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
};

export function TableSearchToolbar({
  fields,
  onSearch,
  matchCount = 0,
  matchIndex = 0,
  onPrev,
  onNext,
  className,
}: Props) {
  const hasMatches = matchCount > 0;

  return (
    <div
      className={cn(
        'grid gap-2 rounded-2xl border border-stone-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-md dark:border-stone-700/50 dark:bg-stone-900/80',
        fields.length === 1 ? 'md:grid-cols-[1fr_auto]' : 'md:grid-cols-4',
        className,
      )}
    >
      {fields.map((f) => (
        <div key={f.label} className="relative">
          <Input
            label={f.label}
            className="h-11 pr-10"
            value={f.value}
            placeholder={f.placeholder}
            onChange={(e) => f.onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
          <Search className="pointer-events-none absolute left-3 top-[2.1rem] h-4 w-4 text-stone-400" />
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-2">
        <Button className="h-11 flex-1 gap-2 sm:flex-none" onClick={onSearch}>
          <Search className="h-4 w-4" />
          بحث
        </Button>
        {hasMatches && matchCount > 1 && onPrev && onNext && (
          <div className="flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-1 dark:border-amber-800 dark:bg-amber-950/40">
            <button
              type="button"
              className="rounded-lg p-2 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/50"
              onClick={onPrev}
              aria-label="النتيجة السابقة"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <span className="min-w-[3rem] text-center text-xs font-bold tabular-nums text-amber-900 dark:text-amber-100">
              {matchIndex + 1}/{matchCount}
            </span>
            <button
              type="button"
              className="rounded-lg p-2 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/50"
              onClick={onNext}
              aria-label="النتيجة التالية"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
        {hasMatches && matchCount === 1 && (
          <span className="self-center text-xs font-medium text-amber-700 dark:text-amber-300">
            نتيجة واحدة
          </span>
        )}
      </div>
    </div>
  );
}
