// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightDotMd from 'starlight-dot-md';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightPageActions from 'starlight-page-actions';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';

/** The 10 Brex API specs — kept in sync with `scripts/specs.config.ts`. */
const SPECS = [
	'accounting',
	'budgets',
	'expenses',
	'fields',
	'onboarding',
	'payments',
	'team',
	'transactions',
	'travel',
	'webhooks',
];

const DESCRIPTION =
	'Unofficial TypeScript SDK for the Brex API — fully typed, tree-shakeable, ' +
	'zero-dependency, and generated deterministically from Brex’s OpenAPI specs.';

// https://astro.build/config
export default defineConfig({
	// Project Pages site: served from https://slingshot.github.io/brex/
	site: 'https://slingshot.github.io',
	base: '/brex',
	integrations: [
		starlight({
			title: 'brex',
			description: DESCRIPTION,
			logo: { src: './src/assets/logo.svg', alt: 'brex SDK' },
			favicon: '/favicon.svg',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/slingshot/brex',
				},
				{
					icon: 'npm',
					label: 'npm',
					href: 'https://www.npmjs.com/package/brex',
				},
			],
			customCss: ['./src/styles/theme.css'],
			editLink: {
				baseUrl: 'https://github.com/slingshot/brex/edit/main/docs/',
			},
			lastUpdated: true,
			plugins: [
				// API reference generated from the SDK's source JSDoc (which is itself
				// generated from the OpenAPI specs). Output lands in the gitignored
				// src/content/docs/api/ dir and is rebuilt on every build.
				starlightTypeDoc({
					entryPoints: [
						'../src/index.ts',
						...SPECS.map((spec) => `../src/${spec}/index.ts`),
					],
					tsconfig: '../tsconfig.lib.json',
					sidebar: { label: 'API reference', collapsed: true },
					// Some subpath entries re-export only types; don't fail the build.
					errorOnEmptyDocumentation: false,
				}),
				// LLM-friendly: /llms.txt, /llms-full.txt, /llms-small.txt.
				starlightLlmsTxt({
					projectName: 'brex',
					description: DESCRIPTION,
					details:
						'brex is an unofficial, community-maintained TypeScript SDK for the Brex API. ' +
						'Every client, method, and type is generated deterministically from Brex’s ' +
						'published OpenAPI specs. It is ESM-only, has zero runtime dependencies, and ' +
						'is tree-shakeable via per-API subpath imports (e.g. `brex/payments`).',
				}),
				// Serve raw Markdown for any page by appending `.md` to its URL.
				starlightDotMd(),
				// Copy-as-Markdown + "Open in ChatGPT / Claude / …" actions per page.
				// No `baseUrl` on purpose: that leaves llms.txt ownership to
				// starlight-llms-txt (page-actions only emits llms.txt when baseUrl is set).
				starlightPageActions({
					share: true,
				}),
			],
			sidebar: [
				{
					label: 'Getting started',
					items: [
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quickstart', slug: 'getting-started/quickstart' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Tree-shakeable imports', slug: 'guides/subpath-imports' },
						{ label: 'Pagination', slug: 'guides/pagination' },
						{ label: 'Authentication', slug: 'guides/authentication' },
						{ label: 'Client & request options', slug: 'guides/options' },
						{ label: 'Error handling', slug: 'guides/error-handling' },
						{ label: 'How generation works', slug: 'guides/how-generation-works' },
						{ label: 'Migrating from v1', slug: 'guides/migrating-from-v1' },
					],
				},
				// API reference group injected by starlight-typedoc.
				typeDocSidebarGroup,
			],
		}),
	],
});
