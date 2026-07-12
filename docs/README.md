# brex documentation site

The [Astro Starlight](https://starlight.astro.build) site published to
**https://slingshot.github.io/brex** by
[`.github/workflows/docs.yml`](../.github/workflows/docs.yml).

This is a self-contained sub-project with its own `package.json` and lockfile —
it is **not** part of the published `brex` npm package, and the library's
`bun install --frozen-lockfile` never touches it.

## How it fits together

- **Guides** (hand-written) live in `src/content/docs/` — these are audited by
  docs-sentinel.
- **API reference** is generated at build time by
  [`starlight-typedoc`](https://github.com/HiDeoo/starlight-typedoc) from the
  SDK source in [`../src`](../src) (via `../tsconfig.lib.json`). It reads the
  JSDoc that `bun run generate` emits into each `*.gen.ts`, so the reference is
  a rendering of the SDK's source of truth. Output lands in the **gitignored**
  `src/content/docs/api/` directory and is rebuilt every time.
- **LLM outputs**: `/llms.txt`, `/llms-full.txt`, `/llms-small.txt`
  (starlight-llms-txt), a raw-Markdown copy of every page via a trailing `.md`
  (starlight-dot-md), and per-page Copy / "Open in AI" actions
  (starlight-page-actions).

## Commands

Run from this `docs/` directory:

| Command | Action |
| :--- | :--- |
| `bun install` | Install dependencies |
| `bun run dev` | Dev server at `localhost:4321/brex` |
| `bun run build` | Build to `./dist/` (also regenerates the API reference) |
| `bun run preview` | Preview the production build locally |

> Internal links in the guide Markdown are written with the `/brex` base path
> (e.g. `/brex/guides/pagination/`) so they resolve correctly in the HTML, the
> raw `.md`, and `llms-full.txt`. If the deploy path ever changes, update both
> `base` in `astro.config.mjs` and these links.
