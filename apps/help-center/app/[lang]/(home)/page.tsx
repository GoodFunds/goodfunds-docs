import { Landing, type LandingContent } from '@/components/home/landing';

// Landing-page copy per locale. The audience switcher (NGO / Agentur / Plattform)
// re-curates the entry cards client-side; the four area cards stay constant.
const content: Record<'de' | 'en', LandingContent> = {
  de: {
    hero: {
      eyebrow: 'GoodFunds Help Center',
      title: 'Hallo. Wie können wir dir helfen?',
      subtitle:'',
      searchPlaceholder: 'Dokumentation durchsuchen…',
      cta: 'Zur vollständigen Dokumentation',
    },
    audienceLabel: 'Ich bin…',
    roles: [
      {
        id: 'ngo',
        label: 'NGO',
        tagline: 'Spenden sammeln und die Anwendung im Alltag nutzen.',
        links: [
          {
            title: 'Erste Schritte',
            description: 'Funktionen und Bedienung der Anwendung.',
            href: '/de/docs/erste-schritte/account-erstellen',
          },
          {
            title: 'Integrationen',
            description: 'GoodFunds mit deinen bestehenden Tools verbinden.',
            href: '/de/docs/integrationen',
          },
        ],
      },
      {
        id: 'agency',
        label: 'Agentur',
        tagline: 'Lösungen für mehrere Organisationen aufsetzen und betreuen.',
        links: [
          {
            title: 'API-Referenz',
            description: 'HTTP-API und Authentifizierung.',
            href: '/de/docs/api',
          },
          {
            title: 'Integrationen',
            description: 'Drittsysteme anbinden und automatisieren.',
            href: '/de/docs/integrationen',
          },
        ],
      },
      {
        id: 'platform',
        label: 'Plattform-Nutzer:in',
        tagline: 'Eigene Anwendungen auf GoodFunds aufbauen.',
        links: [
          {
            title: 'SDK',
            description: 'Client-Bibliotheken und Code-Beispiele.',
            href: '/de/docs/sdk',
          },
          {
            title: 'API-Referenz',
            description: 'Endpunkte, Parameter und Fehlercodes.',
            href: '/de/docs/api',
          },
        ],
      },
    ],
    areasHeading: 'Alle Bereiche',
    areas: [
      {
        slug: '',
        title: 'GoodFunds Hilfe-Center',
        description: 'Anleitungen und Antworten rund um GoodFunds.',
        href: '/de/docs',
      },
      {
        slug: 'api',
        title: 'API',
        description: 'HTTP-API-Referenz und Authentifizierung.',
        href: '/de/docs/api',
      },
      {
        slug: 'sdk',
        title: 'SDK',
        description: 'Client-Bibliotheken und Code-Beispiele.',
        href: '/de/docs/sdk',
      },
      {
        slug: 'integrationen',
        title: 'Integrationen',
        description: 'Anbindung an Drittsysteme.',
        href: '/de/docs/integrationen',
      },
    ],
    docsHref: '/de/docs',
  },
  en: {
    hero: {
      eyebrow: 'GoodFunds Help Center',
      title: 'Hello. How can we help you?',
      subtitle:'',
      searchPlaceholder: 'Search the documentation…',
      cta: 'Open the full documentation',
    },
    audienceLabel: 'I am…',
    roles: [
      {
        id: 'ngo',
        label: 'NGO',
        tagline: 'Raise funds and use the application day to day.',
        links: [
          {
            title: 'Getting started',
            description: 'Features and usage of the application.',
            href: '/en/docs/erste-schritte/account-erstellen',
          },
          {
            title: 'Integrations',
            description: 'Connect GoodFunds with your existing tools.',
            href: '/en/docs/integrationen',
          },
        ],
      },
      {
        id: 'agency',
        label: 'Agency',
        tagline: 'Set up and manage solutions for multiple organisations.',
        links: [
          {
            title: 'API reference',
            description: 'HTTP API and authentication.',
            href: '/en/docs/api',
          },
          {
            title: 'Integrations',
            description: 'Connect and automate third-party systems.',
            href: '/en/docs/integrationen',
          },
        ],
      },
      {
        id: 'platform',
        label: 'Platform user',
        tagline: 'Build your own applications on top of GoodFunds.',
        links: [
          {
            title: 'SDK',
            description: 'Client libraries and code examples.',
            href: '/en/docs/sdk',
          },
          {
            title: 'API reference',
            description: 'Endpoints, parameters and error codes.',
            href: '/en/docs/api',
          },
        ],
      },
    ],
    areasHeading: 'All areas',
    areas: [
      {
        slug: '',
        title: 'GoodFunds Help Center',
        description: 'Guides and answers all around GoodFunds.',
        href: '/en/docs',
      },
      {
        slug: 'api',
        title: 'API',
        description: 'HTTP API reference and authentication.',
        href: '/en/docs/api',
      },
      {
        slug: 'sdk',
        title: 'SDK',
        description: 'Client libraries and code examples.',
        href: '/en/docs/sdk',
      },
      {
        slug: 'integrationen',
        title: 'Integrations',
        description: 'Connecting to third-party systems.',
        href: '/en/docs/integrationen',
      },
    ],
    docsHref: '/en/docs',
  },
};

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  const t = content[lang as keyof typeof content] ?? content.de;

  return <Landing content={t} />;
}
