# goodfunds-docs

Documentation platform for GoodFunds, organized as a monorepo-ready `apps/` layout.
It hosts our public-facing help center today and will grow to cover API/developer
documentation, all sharing one stack, look, and AI index.

The platform is built on [Fumadocs](https://fumadocs.dev) — a documentation
framework that composes directly into the Next.js App Router. It's not an abstract
config framework: it's a set of components we own and build ourselves, which fits
our existing Next.js stack and keeps us in full control of the result.

## Why Fumadocs

- **Native to our stack** — composes directly into the Next.js App Router, so we
  build and customize everything ourselves instead of fighting a closed platform.
- **AI search built in** — a ready-made "Ask AI" component, preconfigured for
  [Inkeep](https://inkeep.com) via the [Vercel AI SDK](https://sdk.vercel.ai).
- **AI-ready content** — automatically generates `llms.txt` / `llms-full.txt` and
  serves per-page Markdown for AI agents.
- **i18n (DE/EN) included** — `.de` / `.en` page suffixes, separate page trees, and
  language-specific search. (German UI strings are ours to set; the default is EN only.)
- **PDF & EPUB export** — PDF via a small Puppeteer script, plus an official EPUB package.
- **Open source, self-hostable** — MIT licensed and EU-hostable, which fits our
  budget and GDPR requirements.

Our reference point is a static knowledge base in the spirit of
[Fundraise Up](https://fundraiseup.com/support) — clean, fast, self-owned — rather
than a Zendesk-style help desk. A few pieces we build ourselves on top of Fumadocs:
feedback buttons ("Was this helpful?"), search analytics, and a help-center landing page.

## Repository structure

```
goodfunds-docs/
├── apps/
│   ├── help-center/   # Fumadocs help center (active)
│   └── api-docs/      # Scalar API/developer docs (planned, later)
└── packages/
    └── ui/            # Shared design tokens (planned)
```

> API/developer documentation (Scalar) is a separate effort that starts only once
> the help center is roughly 75% complete, and after a fresh evaluation of the best
> API-docs tooling.

## Getting started

The active app lives in [apps/help-center/](apps/help-center/). Run all commands from there:

```bash
cd apps/help-center
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

See [apps/help-center/README.md](apps/help-center/README.md) for app-specific details.

## Learn more

- [Fumadocs](https://fumadocs.dev) — the documentation framework
- [Next.js Documentation](https://nextjs.org/docs) — App Router and API reference
