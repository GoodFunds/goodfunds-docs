import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, embed, embedMany, cosineSimilarity } from 'ai';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { source } from '@/lib/source';
import { i18n } from '@/lib/i18n';
import { ChatUIMessage } from '../../../components/ai/search';

interface Doc {
  url: string; // page url + section anchor, e.g. /de/docs/foo#service-layer
  title: string; // page title
  heading: string; // section heading ('' for the intro before the first heading)
  description: string;
  content: string; // section body only
  lang: string; // 'de' | 'en' — keeps a DE question on DE sources
  // precomputed for cheap matching
  _title: string; // lowercased title + heading (for phrase matching)
  _content: string; // lowercased section text (for occurrence counts)
  _titleWords: Set<string>; // whole words in the title + heading
  _descWords: Set<string>; // whole words in the description
}

// Keep letters (including umlauts ä/ö/ü/ß and accents) and digits. The previous
// /[a-z0-9]+/ silently dropped every non-ASCII letter, which gutted German
// retrieval ("ändere" → "ndere", "Spendenkonto" survived but "Prüfung" → "rfung").
const TOKEN_RE = /[\p{L}\p{N}]+/gu;

function words(text: string): Set<string> {
  return new Set(text.toLowerCase().match(TOKEN_RE) ?? []);
}

/** Split a page's markdown into sections at `##`/`###` headings, plus the intro
 * text before the first heading. Section-level chunks give precise answers and
 * deep-link citations, instead of one over-broad chunk per page. The processed
 * markdown renders headings as `## **Title** [#resolved-id]`, so we lift the
 * already-deduped anchor id out and strip the bold markers from the title. */
function splitSections(markdown: string): { heading: string; id: string; body: string }[] {
  const sections: { heading: string; id: string; body: string }[] = [];
  let current = { heading: '', id: '', body: '' };
  for (const line of markdown.split('\n')) {
    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (m) {
      if (current.body.trim()) sections.push(current);
      let text = m[2].trim();
      let id = '';
      const idm = /\s*\[#([^\]]+)\]\s*$/.exec(text);
      if (idm) {
        id = idm[1].trim();
        text = text.slice(0, idm.index);
      }
      text = text.replace(/[*_`]/g, '').trim(); // drop **bold** / `code` markers
      current = { heading: text, id, body: '' };
    } else {
      current.body += `${line}\n`;
    }
  }
  if (current.body.trim()) sections.push(current);
  return sections;
}

/** GitHub-style heading slug, matching how the docs render section anchors. */
function anchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

// Load every doc section once into a small in-memory corpus.
const corpus = createCorpus();

async function createCorpus(): Promise<Doc[]> {
  // getPages() with no argument lists pages from all languages.
  const loaded = await chunkedAll(
    source.getPages().map(async (page) => {
      if (!('getText' in page.data)) return [] as Doc[];
      const title = page.data.title ?? '';
      const description = page.data.description ?? '';
      const lang = page.locale ?? i18n.defaultLanguage;
      const text = await page.data.getText('processed');

      return splitSections(text).map((section) => {
        const heading = section.heading;
        const content = section.body.trim();
        // Prefer the heading's resolved anchor id; fall back to slugifying.
        const slug = section.id || (heading ? anchor(heading) : '');
        const url = slug ? `${page.url}#${slug}` : page.url;
        const titleText = heading ? `${title} ${heading}` : title;
        return {
          url,
          title,
          heading,
          description,
          content,
          lang,
          _title: titleText.toLowerCase(),
          _content: content.toLowerCase(),
          _titleWords: words(titleText),
          _descWords: words(description),
        } satisfies Doc;
      });
    }),
  );

  return loaded.flat().filter((d) => d.content.length > 0);
}

async function chunkedAll<O>(promises: Promise<O>[]): Promise<O[]> {
  const SIZE = 50;
  const out: O[] = [];
  for (let i = 0; i < promises.length; i += SIZE) {
    out.push(...(await Promise.all(promises.slice(i, i + SIZE))));
  }
  return out;
}

// OpenAI (ChatGPT) provider. Both the chat AND embedding models run on OpenAI,
// so the local Ollama/Llama inference is no longer required at runtime.
// DSGVO/privacy note: question text and retrieved doc snippets are now sent to
// OpenAI. Keep the analytics sink anonymized + retention-bounded (see below),
// and ensure a DPA with OpenAI is in place before production use.
// Configure via OPENAI_API_KEY (required); optional OPENAI_BASE_URL lets you
// point at a proxy/Azure-compatible gateway.
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // undefined → OpenAI default endpoint
});

// Embedding model for semantic retrieval. `text-embedding-3-small` is cheap,
// multilingual (good DE/EN) and needs no task-prefixing of queries vs documents.
const embeddingModel = openai.embeddingModel(
  process.env.OPENAI_EMBED_MODEL ?? 'text-embedding-3-small',
);
const EMBED_INPUT_CHARS = 2000; // cap text fed to the embedder per chunk
// OpenAI's embeddings endpoint accepts large batches (up to 2048 inputs), so we
// can embed the corpus in far fewer round-trips than the local runner allowed.
const EMBED_BATCH = Number(process.env.OPENAI_EMBED_BATCH ?? 256);

async function embedBatched(values: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < values.length; i += EMBED_BATCH) {
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: values.slice(i, i + EMBED_BATCH),
    });
    out.push(...embeddings);
  }
  return out;
}

// How much each signal contributes to the hybrid score, and the cosine bar
// below which we treat retrieval as "found nothing relevant" (for analytics).
const LEX_WEIGHT = 0.45;
const SEM_WEIGHT = 0.55;
// OpenAI's text-embedding-3 models spread cosine similarity much wider than
// nomic did: unrelated text lands around ~0.1–0.3, on-topic matches ~0.4+. The
// relevance bar therefore drops well below the old nomic-specific 0.55 floor.
// Cross-lingual matches (a DE question against EN content) score lower than
// DE↔DE, so keep it modest until real translated content exists. Tune per model
// and corpus via CHAT_SEM_THRESHOLD.
const SEM_RELEVANCE = Number(process.env.CHAT_SEM_THRESHOLD ?? 0.3);

interface IndexEntry {
  doc: Doc;
  vec: number[];
}

// Embed the whole corpus once at startup (re-runs on every deploy, which is the
// in-memory equivalent of the "re-index on doc change" pipeline). For a larger
// corpus this moves to a persisted vector store (e.g. pgvector) + a CI job.
const index: Promise<IndexEntry[]> = buildIndex();

async function buildIndex(): Promise<IndexEntry[]> {
  const docs = await corpus;
  if (docs.length === 0) return [];
  const values = docs.map(
    (d) =>
      `${d.heading ? `${d.heading}\n\n` : ''}${d.content.slice(0, EMBED_INPUT_CHARS)}`,
  );
  try {
    const embeddings = await embedBatched(values);
    return docs.map((doc, i) => ({ doc, vec: embeddings[i] }));
  } catch (err) {
    // Embedding the corpus failed at startup (e.g. OpenAI outage, rate limit, or
    // a missing/invalid key). Don't take the whole chat down: keep the corpus
    // with empty vectors so retrieval still works in lexical-only mode. A redeploy
    // re-runs this; per-query embeds may also recover once the provider is back.
    console.error('[chat] corpus embedding failed — falling back to lexical-only', err);
    return docs.map((doc) => ({ doc, vec: [] }));
  }
}

// How many docs to retrieve and how much of each to inject into the prompt.
const SEARCH_LIMIT = 6;
const SNIPPET_CHARS = 1500;

// Question words (DE + EN) that carry no retrieval signal and would otherwise
// skew ranking (e.g. "explain layering" / "erkläre Layering" should rank on
// "layering", not the question word).
const STOPWORDS = new Set([
  // English
  'a', 'an', 'and', 'about', 'are', 'as', 'be', 'by', 'can', 'do', 'does',
  'explain', 'for', 'from', 'how', 'i', 'in', 'is', 'it', 'me', 'of', 'on',
  'or', 'please', 'tell', 'that', 'the', 'this', 'to', 'use', 'using', 'what',
  'when', 'where', 'which', 'why', 'with', 'you', 'your',
  // German
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem',
  'einer', 'eines', 'und', 'oder', 'aber', 'wie', 'was', 'wo', 'wer', 'wann',
  'warum', 'wieso', 'welche', 'welcher', 'welches', 'ich', 'du', 'er', 'sie',
  'es', 'wir', 'mir', 'mich', 'dich', 'man', 'ist', 'sind', 'war', 'waren',
  'bin', 'bist', 'hat', 'habe', 'haben', 'kann', 'kannst', 'koennen', 'können',
  'soll', 'sollen', 'muss', 'muessen', 'müssen', 'für', 'fuer', 'von', 'vom',
  'mit', 'auf', 'aus', 'an', 'am', 'im', 'zu', 'zum', 'zur', 'bei', 'nach',
  'über', 'ueber', 'unter', 'wenn', 'dass', 'als', 'auch', 'nur', 'noch',
  'schon', 'bitte', 'erkläre', 'erklaere', 'erklär', 'mein', 'meine',
]);

/** Significant words in query order (stopwords removed, duplicates kept for phrasing). */
function orderedTerms(query: string): string[] {
  const tokens = query.toLowerCase().match(TOKEN_RE) ?? [];
  return tokens.filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function tokenize(query: string): string[] {
  return [...new Set(orderedTerms(query))];
}

/**
 * Multi-word phrases from the query (adjacent bigrams + the full phrase). A
 * phrase hit like "data mapper" or "service layer" is a much stronger signal
 * than the individual words, which matters because patterns live inside larger
 * chapter pages.
 */
function phrases(query: string): string[] {
  const terms = orderedTerms(query);
  const out: string[] = [];
  for (let i = 0; i < terms.length - 1; i++) out.push(`${terms[i]} ${terms[i + 1]}`);
  if (terms.length > 2) out.push(terms.join(' '));
  return [...new Set(out)];
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

/** Score a doc: phrase hits dominate, then title words, then content frequency. */
function scoreDoc(doc: Doc, tokens: string[], queryPhrases: string[]): number {
  let score = 0;
  for (const t of tokens) {
    if (doc._titleWords.has(t)) score += 10;
    if (doc._descWords.has(t)) score += 3;
    score += Math.min(countOccurrences(doc._content, t), 5);
  }
  for (const phrase of queryPhrases) {
    if (doc._title.includes(phrase)) score += 40;
    score += Math.min(countOccurrences(doc._content, phrase), 4) * 8;
  }
  return score;
}

interface Retrieved {
  docs: Doc[];
  answered: boolean; // did we find anything relevant (for analytics)
  topScore: number; // best cosine similarity in the result set
}

/**
 * Hybrid retrieval: blend the lexical score (exact term/phrase hits) with
 * semantic cosine similarity (paraphrase / synonym matches). Lexical alone
 * misses "wie ändere ich das Formular" → "edit the form"; semantic alone is
 * fuzzy on exact product terms. Both signals are min-max normalized over the
 * candidate pool, then combined. Falls back to lexical-only if the embedder
 * is unreachable, so the chat keeps working.
 */
async function hybridRetrieve(
  entries: IndexEntry[],
  query: string,
  tokens: string[],
  queryPhrases: string[],
  lang: string,
  limit: number,
): Promise<Retrieved> {
  if (!query.trim()) return { docs: [], answered: false, topScore: 0 };

  // Prefer sources in the question's language; fall back to the whole corpus if
  // that language has no content yet, so an EN question still gets an answer.
  const langPool = entries.filter((e) => e.doc.lang === lang);
  const pool = langPool.length > 0 ? langPool : entries;
  if (pool.length === 0) return { docs: [], answered: false, topScore: 0 };

  let qVec: number[] | null = null;
  try {
    const { embedding } = await embed({
      model: embeddingModel,
      value: query,
    });
    qVec = embedding;
  } catch {
    qVec = null; // embedder down → degrade gracefully to lexical-only
  }

  const scored = pool.map((e) => ({
    doc: e.doc,
    lex: scoreDoc(e.doc, tokens, queryPhrases),
    // e.vec is empty if the corpus failed to embed at startup → lexical-only.
    sem: qVec && e.vec.length ? cosineSimilarity(qVec, e.vec) : 0,
  }));

  const maxLex = Math.max(0, ...scored.map((s) => s.lex));
  const minSem = Math.min(...scored.map((s) => s.sem));
  const maxSem = Math.max(...scored.map((s) => s.sem));
  const spanSem = maxSem - minSem || 1;

  const ranked = scored
    .map((s) => {
      const normLex = maxLex > 0 ? s.lex / maxLex : 0;
      const normSem = qVec ? (s.sem - minSem) / spanSem : 0;
      const combined = qVec ? LEX_WEIGHT * normLex + SEM_WEIGHT * normSem : normLex;
      return { ...s, combined };
    })
    .sort((a, b) => b.combined - a.combined)
    .slice(0, limit);

  const topScore = Math.max(0, ...ranked.map((r) => r.sem));
  // Relevance for analytics uses the semantic score: lexical drives ranking, but
  // a single common word ("best", "use") shouldn't flag a question as answered.
  // If the embedder was down, fall back to "did any exact term hit at all".
  const answered = qVec ? topScore >= SEM_RELEVANCE : maxLex > 0;
  return { docs: ranked.map((r) => r.doc), answered, topScore };
}

// The docs themselves contain literal URLs (e.g. book references like
// "http://members.aol.com/.../Chasms.htm"). Strip them from injected snippets so
// the model can't echo them as if they were sources — it must cite only the
// result `URL:` lines we provide.
function stripUrls(text: string): string {
  return text
    .replace(/<https?:\/\/[^>]+>/gi, '') // autolinks
    .replace(/\bhttps?:\/\/[^\s)]+/gi, '') // bare urls
    .replace(/\bwww\.[^\s)]+/gi, '')
    .replace(/[ \t]{2,}/g, ' ');
}

/**
 * Extract a snippet centered on where the query first matches in the page,
 * rather than always the page's opening. Patterns (Data Mapper, Service Layer…)
 * live deep inside large chapter pages, so a head-only snippet would miss them.
 */
function bestSnippet(doc: Doc, tokens: string[], queryPhrases: string[]): string {
  const hay = doc._content;
  let pos = -1;
  const consider = (i: number) => {
    if (i !== -1 && (pos === -1 || i < pos)) pos = i;
  };
  for (const p of queryPhrases) consider(hay.indexOf(p));
  if (pos === -1) for (const t of tokens) consider(hay.indexOf(t));
  if (pos === -1) pos = 0;

  let start = Math.max(0, pos - 250);
  if (start > 0) {
    const ws = doc.content.indexOf(' ', start);
    if (ws !== -1 && ws < start + 40) start = ws + 1;
  }
  const end = Math.min(doc.content.length, start + SNIPPET_CHARS);
  let snippet = stripUrls(doc.content.slice(start, end)).trim();
  if (start > 0) snippet = `… ${snippet}`;
  if (end < doc.content.length) snippet = `${snippet} …`;
  return snippet;
}

/** Pull the most recent user message's text out of the incoming UI messages. */
function latestUserQuery(messages: ChatUIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== 'user') continue;
    const text = (m.parts ?? [])
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join(' ')
      .trim();
    if (text) return text;
  }
  return '';
}

/** The page URL the user asked from, sent by the client as a `data-client` part. */
function latestClientLocation(messages: ChatUIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== 'user') continue;
    for (const p of m.parts ?? []) {
      if (p.type === 'data-client') {
        const loc = (p as { data?: { location?: string } }).data?.location;
        if (loc) return loc;
      }
    }
  }
  return '';
}

// Local analytics sink: append one JSON line per question so we can see which
// questions are asked and which go unanswered (ticket scope). Best-effort —
// never blocks or breaks the response. NOTE: question text can be personal data;
// before this leaves a dev machine, anonymize + bound retention (DSGVO, GFL-134
// open question #7). Point CHAT_ANALYTICS_FILE elsewhere or swap for Postgres.
const ANALYTICS_PATH =
  process.env.CHAT_ANALYTICS_FILE ?? join(process.cwd(), '.data', 'chat-events.jsonl');

async function logChatEvent(event: Record<string, unknown>): Promise<void> {
  try {
    await mkdir(dirname(ANALYTICS_PATH), { recursive: true });
    await appendFile(ANALYTICS_PATH, `${JSON.stringify(event)}\n`, 'utf8');
  } catch {
    // analytics must never break the chat
  }
}

const LANGS = new Set<string>(i18n.languages);

/**
 * The site origin (scheme + host[:port]) to build absolute citation URLs.
 * Doc URLs are root-relative paths like `/de/docs/...`; if we hand those to the
 * model bare, it tends to "absolutize" them by prepending `http://`, turning the
 * first path segment into a host (`http://de/docs/...`). Prefixing the real
 * origin here yields correct links (`http://localhost:3000/de/docs/...`).
 * Preference order: the page the user is actually on → forwarded/host headers →
 * NEXT_PUBLIC_SITE_URL → the request URL's own origin.
 */
function siteOrigin(location: string, req: Request): string {
  try {
    if (location) return new URL(location).origin;
  } catch {
    // location empty or malformed — fall through.
  }
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (host) {
    const proto = req.headers.get('x-forwarded-proto') ?? 'http';
    return `${proto}://${host}`;
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, '');
  try {
    return new URL(req.url).origin;
  } catch {
    return '';
  }
}

/** Pick the retrieval language from the page the user is on (/de/…, /en/…). */
function detectLang(location: string): string {
  try {
    const first = new URL(location).pathname.split('/').filter(Boolean)[0]?.toLowerCase();
    if (first && LANGS.has(first)) return first;
  } catch {
    // location may be empty or malformed — fall through to the default language.
  }
  return i18n.defaultLanguage;
}

/**
 * Retrieval-augmented generation: we search the docs ourselves and inject the
 * results into the system prompt, instead of relying on the model to call a
 * tool. We keep this manual-RAG approach after the move to OpenAI — it gives us
 * full control over which sources reach the model and keeps citations grounded
 * in the `URL:` lines we provide, rather than anything the model invents.
 */
export async function POST(req: Request) {
  const reqJson = await req.json();
  const messages: ChatUIMessage[] = reqJson.messages ?? [];

  const query = latestUserQuery(messages);
  const location = latestClientLocation(messages);
  const lang = detectLang(location);
  const origin = siteOrigin(location, req);
  const tokens = tokenize(query);
  const queryPhrases = phrases(query);
  const { docs, answered, topScore } = await hybridRetrieve(
    await index,
    query,
    tokens,
    queryPhrases,
    lang,
    SEARCH_LIMIT,
  );

  void logChatEvent({
    ts: new Date().toISOString(),
    lang,
    query,
    answered,
    topScore: Number(topScore.toFixed(4)),
    resultUrls: docs.map((d) => d.url),
  });

  const context = docs
    .map((doc, i) => {
      const label = doc.heading ? `${doc.title} — ${doc.heading}` : doc.title;
      const url = doc.url.startsWith('/') ? `${origin}${doc.url}` : doc.url;
      return `## Result ${i + 1}: ${label}\nURL: ${url}\n\n${bestSnippet(doc, tokens, queryPhrases)}`;
    })
    .join('\n\n---\n\n');

  const systemPrompt = [
    'You are an AI assistant for a documentation site.',
    'Answer the user question using ONLY the documentation context provided below.',
    'Answer in the same language as the user question.',
    'Do NOT mention searching, tools, or function calls; the context is already retrieved for you.',
    'Cite sources ONLY as markdown links built from the `URL:` lines of the results below.',
    'Use each `URL:` value EXACTLY as given — do not shorten, rewrite, or add a scheme/host.',
    'Never present a URL that appears inside the documentation text as a source.',
    'If the answer is not contained in the context, say you do not know and suggest a more specific question.',
    '',
    '# Documentation context',
    context || '(no relevant documentation was found for this question)',
  ].join('\n');

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
    system: systemPrompt,
    // The OpenAI provider retries transient failures (429 rate limits, 5xx)
    // with exponential backoff before giving up.
    maxRetries: 3,
    messages: await convertToModelMessages<ChatUIMessage>(messages, {
      convertDataPart(part) {
        if (part.type === 'data-client')
          return {
            type: 'text',
            text: `[Client Context: ${JSON.stringify(part.data)}]`,
          };
      },
    }),
  });

  return result.toUIMessageStreamResponse({
    // Surface a friendly, language-aware message instead of leaking provider
    // errors (rate limits, auth, upstream outages) to the user.
    onError: (error) => {
      console.error('[chat] streaming error', error);
      return lang === 'de'
        ? 'Entschuldigung, der Assistent ist gerade nicht erreichbar. Bitte versuche es in einem Moment erneut.'
        : 'Sorry, the assistant is currently unavailable. Please try again in a moment.';
    },
  });
}
