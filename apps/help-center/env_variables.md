# Environment Variables

All environment variables used by the Help Center app. Copy `.env-example` to
`.env.local` and fill in the required values. `.env.local` is gitignored — never
commit real secrets.

They all configure the AI chat assistant (`app/api/chat/route.ts`).

## Required

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key powering the chat assistant (completions **and** embeddings). Create one at <https://platform.openai.com/api-keys>. Without it the chat falls back to lexical-only retrieval and cannot generate answers. |

## Optional

| Variable | Default | Description |
| --- | --- | --- |
| `OPENAI_MODEL` | `gpt-4o-mini` | Chat completion model used to generate answers. |
| `OPENAI_EMBED_MODEL` | `text-embedding-3-small` | Embedding model used for semantic retrieval over the docs. |
| `OPENAI_BASE_URL` | _(OpenAI default)_ | Override the API endpoint, e.g. to route through a proxy or an Azure/OpenAI-compatible gateway. |
| `OPENAI_EMBED_BATCH` | `256` | Number of text chunks sent per embeddings request when indexing the corpus. Lower it if you hit request-size limits. |
| `CHAT_SEM_THRESHOLD` | `0.3` | Cosine-similarity floor above which a result counts as "relevant". Used for the answered/unanswered analytics flag, not for ranking. Tune per embedding model and corpus. |
| `NEXT_PUBLIC_SITE_URL` | _(derived)_ | Site origin (e.g. `https://help.goodfunds.de`) used to build absolute citation links. Normally derived automatically from the visitor's page or request headers; set this only as a fallback for non-browser/server contexts. |
| `CHAT_ANALYTICS_FILE` | `.data/chat-events.jsonl` | Path to the local JSONL sink that logs one event per question (query, language, whether it was answered, result URLs). **Contains user question text — anonymize and bound retention before production (DSGVO).** |
