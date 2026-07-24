// lib/db/index.js
// Edge-compatible DB adapter using Cloudflare D1
// ⚠️  Do NOT import schema.js, connection.js, or better-sqlite3 here —
//     esbuild (used by next-on-pages) statically traces ALL imports,
//     including dynamic ones, and will fail to bundle native Node modules.
//
// For local dev: run `npx wrangler pages dev` (not `next dev`)
// to get a local D1 emulation with the same bindings.

import { createD1Adapter } from './d1-adapter.js';

export async function getDb() {
  let ctx;
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    ctx = getRequestContext();
  } catch (e) {
    throw new Error(
      'getRequestContext() failed — are you running outside the Cloudflare edge runtime? ' +
      'Use "npx wrangler pages dev" for local development with D1.'
    );
  }

  if (!ctx?.env?.DB) {
    throw new Error(
      'D1 binding "DB" not found. ' +
      'Add a D1 binding named "DB" in Cloudflare Pages → Settings → Functions → D1 database bindings.'
    );
  }

  return createD1Adapter(ctx.env.DB);
}

