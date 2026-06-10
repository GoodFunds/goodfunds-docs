// One-off: split the PEAA book markdown into a Fumadocs docs tree.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SRC = join(
  ROOT,
  'content',
  'martin fowler - Patterns of Enterprise Application Architecture.md',
);
const DOCS = join(ROOT, 'content', 'docs');

const lines = readFileSync(SRC, 'utf8').split(/\r?\n/);

// Lines (1-based, inclusive start / exclusive end) → file.
const sliceLines = (start, end) => lines.slice(start - 1, end - 1);

const DROP = [
  /^From the Library of Kyle Geoffrey Passarelli\s*$/,
  /^_This page intentionally left blank_\s*$/,
  /^~~Pd~~/,
];

// Escape `<` outside inline code spans so raw book tags like `<screen>` render
// as literal text instead of becoming raw HTML (which the MD->MDX pipeline
// cannot compile: "Cannot handle unknown node `raw`").
function escapeAngles(line) {
  const parts = line.split('`');
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(/</g, '&lt;');
  }
  return parts.join('`');
}

function clean(arr) {
  const kept = arr.filter((l) => !DROP.some((re) => re.test(l)));
  // collapse 3+ blank lines into one; escape angle brackets outside code fences
  const out = [];
  let blanks = 0;
  let inFence = false;
  for (let l of kept) {
    if (/^\s*(```|~~~)/.test(l)) {
      inFence = !inFence;
    } else if (!inFence) {
      l = escapeAngles(l);
    }
    if (l.trim() === '') {
      blanks++;
      if (blanks > 1) continue;
    } else {
      blanks = 0;
    }
    out.push(l);
  }
  return out.join('\n').trim() + '\n';
}

function page(relPath, title, description, start, end, ext = 'md') {
  const fm = ['---', `title: "${title}"`];
  if (description) fm.push(`description: "${description}"`);
  fm.push('---', '', '');
  const body = clean(sliceLines(start, end));
  const full = fm.join('\n') + body;
  const abs = join(DOCS, `${relPath}.${ext}`);
  writeFileSync(abs, full, 'utf8');
  return abs;
}

function meta(relDir, obj) {
  writeFileSync(join(DOCS, relDir, 'meta.json'), JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

mkdirSync(join(DOCS, 'narratives'), { recursive: true });
mkdirSync(join(DOCS, 'patterns'), { recursive: true });

// Remove scaffolding demo page.
try {
  rmSync(join(DOCS, 'test.mdx'));
} catch {}

// --- Landing page (custom) -------------------------------------------------
writeFileSync(
  join(DOCS, 'index.mdx'),
  `---
title: Patterns of Enterprise Application Architecture
description: Martin Fowler's catalog of enterprise application architecture patterns, as browsable docs.
---

# Patterns of Enterprise Application Architecture

**Martin Fowler** — with contributions from David Rice, Matthew Foemmel, Edward
Hieatt, Robert Mee, and Randy Stafford. _Addison-Wesley, 2003 (ISBN 0-321-12742-0)._

This site mirrors the structure of the book as browsable documentation.

## Contents

- [Preface](/docs/preface)
- [Introduction](/docs/introduction)

### Part 1 · The Narratives

1. [Layering](/docs/narratives/layering)
2. [Organizing Domain Logic](/docs/narratives/organizing-domain-logic)
3. [Mapping to Relational Databases](/docs/narratives/mapping-to-relational-databases)
4. [Web Presentation](/docs/narratives/web-presentation)
5. [Concurrency](/docs/narratives/concurrency)
6. [Session State](/docs/narratives/session-state)
7. [Distribution Strategies](/docs/narratives/distribution-strategies)
8. [Putting It All Together](/docs/narratives/putting-it-all-together)

### Part 2 · The Patterns

9. [Domain Logic Patterns](/docs/patterns/domain-logic-patterns)
10. [Data Source Architectural Patterns](/docs/patterns/data-source-architectural-patterns)
11. [Object-Relational Behavioral Patterns](/docs/patterns/object-relational-behavioral-patterns)
12. [Object-Relational Structural Patterns](/docs/patterns/object-relational-structural-patterns)
13. [Object-Relational Metadata Mapping Patterns](/docs/patterns/object-relational-metadata-mapping-patterns)
14. [Web Presentation Patterns](/docs/patterns/web-presentation-patterns)
15. [Distribution Patterns](/docs/patterns/distribution-patterns)
16. [Offline Concurrency Patterns](/docs/patterns/offline-concurrency-patterns)
17. [Session State Patterns](/docs/patterns/session-state-patterns)
18. [Base Patterns](/docs/patterns/base-patterns)

- [References](/docs/references)
`,
  'utf8',
);

// --- Front matter & end ----------------------------------------------------
page('preface', 'Preface', 'Preface, who this book is for, acknowledgments, and colophon.', 129, 279);
page('introduction', 'Introduction', 'Architecture, enterprise applications, performance, and patterns.', 279, 497);
page('references', 'References', 'Bibliography.', 11505, lines.length + 1);

// --- Part 1: The Narratives ------------------------------------------------
page('narratives/index', 'Part 1 · The Narratives', 'Overview of Part 1.', 497, 507);
const narratives = [
  ['layering', 'Layering', 507, 669],
  ['organizing-domain-logic', 'Organizing Domain Logic', 669, 815],
  ['mapping-to-relational-databases', 'Mapping to Relational Databases', 815, 1220],
  ['web-presentation', 'Web Presentation', 1220, 1330],
  ['concurrency', 'Concurrency', 1330, 1649],
  ['session-state', 'Session State', 1649, 1753],
  ['distribution-strategies', 'Distribution Strategies', 1753, 1891],
  ['putting-it-all-together', 'Putting It All Together', 1891, 2170],
];
for (const [slug, title, s, e] of narratives) page(`narratives/${slug}`, title, '', s, e);

// --- Part 2: The Patterns --------------------------------------------------
page('patterns/index', 'Part 2 · The Patterns', 'Overview of Part 2.', 2170, 2180);
const patterns = [
  ['domain-logic-patterns', 'Domain Logic Patterns', 2180, 2968],
  ['data-source-architectural-patterns', 'Data Source Architectural Patterns', 2968, 3846],
  ['object-relational-behavioral-patterns', 'Object-Relational Behavioral Patterns', 3846, 4572],
  ['object-relational-structural-patterns', 'Object-Relational Structural Patterns', 4572, 6781],
  ['object-relational-metadata-mapping-patterns', 'Object-Relational Metadata Mapping Patterns', 6781, 7309],
  ['web-presentation-patterns', 'Web Presentation Patterns', 7309, 8765],
  ['distribution-patterns', 'Distribution Patterns', 8765, 9347],
  ['offline-concurrency-patterns', 'Offline Concurrency Patterns', 9347, 10177],
  ['session-state-patterns', 'Session State Patterns', 10177, 10375],
  ['base-patterns', 'Base Patterns', 10375, 11505],
];
for (const [slug, title, s, e] of patterns) page(`patterns/${slug}`, title, '', s, e);

// --- meta.json (ordering) --------------------------------------------------
meta('', {
  pages: ['index', 'preface', 'introduction', 'narratives', 'patterns', 'references'],
});
meta('narratives', {
  title: 'Part 1 · The Narratives',
  pages: ['index', ...narratives.map(([slug]) => slug)],
});
meta('patterns', {
  title: 'Part 2 · The Patterns',
  pages: ['index', ...patterns.map(([slug]) => slug)],
});

console.log('Done. Wrote', 2 + 3 + narratives.length + patterns.length, 'pages + 3 meta.json');
