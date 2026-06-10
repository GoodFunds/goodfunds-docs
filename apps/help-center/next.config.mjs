import { createMDX } from 'fumadocs-mdx/next';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const appDir = dirname(fileURLToPath(import.meta.url));

// Standalone output + file tracing are only needed for the production Docker
// image. Enabling them in `next dev` makes every compile run the file tracer
// over the whole project (incl. .next/standalone), which can hang the machine.
const isProd = process.env.NODE_ENV === 'production';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Pin the Turbopack workspace root to this app (a parent-dir lockfile would
  // otherwise be inferred as the root and emit a warning / wrong paths).
  turbopack: { root: appDir },
  // Serve images as-is so the runtime image needs no native `sharp` dependency.
  images: { unoptimized: true },
  ...(isProd
    ? {
        // Emit a self-contained server bundle (.next/standalone) for the Dockerfile.
        output: 'standalone',
        // Pin the trace root to this app so the standalone output is flat
        // (.next/standalone/server.js) regardless of parent dirs on the host.
        outputFileTracingRoot: appDir,
      }
    : {}),
};

export default withMDX(config);
