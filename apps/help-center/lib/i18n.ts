import { defineI18n } from 'fumadocs-core/i18n';

// German is the default language; English is the secondary locale.
// Locale is always shown in the URL, so pages live under /de/... and /en/...
export const i18n = defineI18n({
  defaultLanguage: 'de',
  languages: ['de', 'en'],
});
