import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// Multilingual search: map each locale to an Orama-supported stemmer language
// so DE and EN content are indexed and queried correctly.
// https://docs.orama.com/docs/orama-js/supported-languages
export const { GET } = createFromSource(source, {
  localeMap: {
    de: 'german',
    en: 'english',
  },
});
