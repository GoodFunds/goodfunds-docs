import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { uiTranslations } from 'fumadocs-ui/i18n';
import { i18n } from '@/lib/i18n';
import { appName, gitConfig } from '@/lib/shared';

// UI chrome translations. English is the built-in baseline (uiTranslations);
// German strings override the most visible labels.
export const translations = i18n
  .translations()
  .extend(uiTranslations())
  .add('ui', {
    de: {
      displayName: 'Deutsch',
      search: 'Suchen',
      searchNoResult: 'Keine Ergebnisse',
      toc: 'Auf dieser Seite',
      lastUpdate: 'Zuletzt aktualisiert',
      chooseLanguage: 'Sprache wählen',
      nextPage: 'Nächste Seite',
      previousPage: 'Vorherige Seite',
      chooseTheme: 'Design wählen',
      editOnGithub: 'Auf GitHub bearbeiten',
    },
    en: {
      displayName: 'English',
    },
  });

// The documentation areas. Each maps to a `root: true` tree under
// content/docs and gets its own sidebar; here they drive the top-nav links.
// An empty slug points at the main help-center tree (/docs).
export const areas = [
  { slug: '', de: 'Hilfe-Center', en: 'Help Center' },
  { slug: 'api', de: 'API', en: 'API' },
] as const;

export function baseOptions(locale: string): BaseLayoutProps {
  return {
    nav: {
      title: (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/icon.png"
          alt={appName}
          width={45}
          height={24}
          style={{ height: 24, width: 'auto' }}
        />
      ),
      url: `/${locale}`,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: areas.map((area) => ({
      type: 'main',
      text: locale === 'de' ? area.de : area.en,
      url: area.slug ? `/${locale}/docs/${area.slug}` : `/${locale}/docs`,
    })),
  };
}
