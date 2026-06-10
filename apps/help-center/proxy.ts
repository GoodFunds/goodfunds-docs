import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware';
import { i18n } from '@/lib/i18n';

// Redirects `/` to the default locale and ensures every docs URL is
// locale-prefixed (`/de/...`, `/en/...`).
export default createI18nMiddleware(i18n);

export const config = {
  // Run on page routes only. Skip API, Next internals, the og/llms routes, and
  // any static file (anything containing a `.`, e.g. /icon.png, /GoodFunds-Logo.png,
  // /docs-assets/*) so static assets aren't locale-redirected.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|og|llms|.*\\.).*)'],
};
