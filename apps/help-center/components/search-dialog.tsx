'use client';
import { useMemo } from 'react';
import { useDocsSearch } from 'fumadocs-core/search/client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useI18n } from 'fumadocs-ui/contexts/i18n';

// The four documentation areas, used as the empty-state shortcuts. Labels are
// locale-aware; kept inline to avoid pulling server-side layout config client-side.
const areas = [
  { slug: 'api', de: 'API', en: 'API' },
  { slug: 'sdk', de: 'SDK', en: 'SDK' },
  { slug: 'integrationen', de: 'Integrationen', en: 'Integrations' },
] as const;

// Custom Quicksearch command palette. Reuses the existing Orama backend
// (`/api/search`) via `useDocsSearch`; matched headings and text snippets come
// back inside `query.data`, so the dropdown shows page + section previews.
export function CustomSearchDialog(props: SharedProps) {
  const { locale } = useI18n();
  const { search, setSearch, query } = useDocsSearch({
    type: 'fetch',
    api: '/api/search',
    locale,
  });

  // Empty-state: jump straight into one of the four areas.
  const defaultItems = useMemo(
    () =>
      areas.map((area) => ({
        type: 'page' as const,
        id: area.slug,
        content: locale === 'en' ? area.en : area.de,
        url: `/${locale ?? 'de'}/docs/${area.slug}`,
      })),
    [locale],
  );

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== 'empty' ? query.data : defaultItems} />
        <SearchDialogFooter className="flex items-center justify-between text-xs text-fd-muted-foreground">
          <span>
            {locale === 'en'
              ? 'Search powered by the GoodFunds index'
              : 'Suche über den GoodFunds-Index'}
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono">
              ⌘
            </kbd>
            <kbd className="rounded border border-fd-border bg-fd-muted px-1.5 py-0.5 font-mono">
              K
            </kbd>
          </span>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}

export default CustomSearchDialog;
