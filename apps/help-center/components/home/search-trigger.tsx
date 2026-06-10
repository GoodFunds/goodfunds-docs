'use client';
import { Search } from 'lucide-react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { cn } from '@/lib/cn';

export interface HomeSearchTriggerProps {
  placeholder: string;
  className?: string;
}

// Opens the global cmd+k Quicksearch palette. The hotkey itself is registered by
// the RootProvider; this is the visible affordance on the landing page.
export function HomeSearchTrigger({ placeholder, className }: HomeSearchTriggerProps) {
  const { setOpenSearch } = useSearchContext();

  return (
    <button
      type="button"
      onClick={() => setOpenSearch(true)}
      className={cn(
        'group flex w-full max-w-md items-center gap-3 rounded-xl border border-fd-border bg-fd-card px-4 py-3 text-left text-fd-muted-foreground shadow-sm transition-colors hover:border-fd-primary/40 hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
        className,
      )}
    >
      <Search className="size-5 shrink-0" />
      <span className="flex-1 truncate text-sm">{placeholder}</span>
      <span className="hidden items-center gap-1 sm:inline-flex">
        <kbd className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono text-xs">
          ⌘
        </kbd>
        <kbd className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono text-xs">
          K
        </kbd>
      </span>
    </button>
  );
}
