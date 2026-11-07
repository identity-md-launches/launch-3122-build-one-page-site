# FLOP, by choice.

A one page proposal for FLOP as an opt in provider in the IMD worker, written for IMD seat holders and the IMD team. The production export is `dist/`. It uses relative URLs and works at a static hosting subpath.

## Install, preview and rebuild

Use Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

To check and produce the deliverable:

```sh
npm run typecheck
npm run build
npm run preview
```

Publish the contents of `dist/` as supplied. No server routes, backend, environment file or credentials are required. The source, exact dependency versions, lockfile and complete export are included. Hosting is handled separately by IMD.

## Content and data

The content base is the [accepted IMD proposal, dated 7 Nov 2026](https://github.com/Identity-md/research/blob/main/jobs/4bb06f36-c8da-4925-8e4d-378ed76cff68/files/artifacts/report.md). The page links to the full report and its companion CLI spec. Proposed worker commands are clearly marked as proposed.

The page incorporates the requested updates about the public devnet, the TechnoCore identity key, and the oracle and research panel ceilings. Sources are linked beside the claims. The testnet date is deliberately left unannounced, with a link to @flop_labs.

On each page load, `src/data.ts` attempts each public endpoint once, independently, with an eight second timeout:

- `https://api.imd.fun/swarm`: reads `health.agentsOnline` and `health.seatsEnrolled`.
- `https://api.flop.network/v1/models`: reads the catalog count and validates the model entries.

There is no polling, enrollment or authentication. Successful counts say “Live on load”. Network, HTTP, JSON, schema and timeout failures retain explicitly dated snapshots. A zero count is valid.

**Fallback source limitation:** the report records one model, Qwen2.5 0.5B Instruct, on 7 Nov 2026, but does not record IMD online or enrolled totals. The IMD fallback therefore uses an additional observation of the supplied public API, stored with its source and exact timestamp in `src/swarm-snapshot.json`: 1,045 online and 1,077 enrolled on 7 Nov 2026. The page states that distinction. These are neither invented counts nor represented as report figures.

## Validation actually run

On 7 Nov 2026:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; production export generated |
| `node scripts/check-site.mjs` with the supplied Chromium runtime | 11 checks passed, none failed; one optional WebKit check skipped |
| Pinned taste@1 probe | 16 of 16 checks passed |
| Axe WCAG A and AA checks on the rendered page | No violations; 26 rules passed; manual review remains necessary |
| Rendered widths | 320, 390, 560, 784, 1040 and 1440 pixels; no horizontal overflow |
| Main action on first screen at 390 | Confirmed visually and by bounding box |
| Largest accepted counts | All three maximum safe integer counts wrap without overflow |
| Static hosting | Checked at a nested `/preview/proposals/flop/` path |

The interaction checks exercise live and zero counts, independent source failures, HTTP errors, network errors, malformed JSON, invalid fields, the actual eight second timeout, one request per endpoint, in-page navigation, both Telegram links, the CLI destination, local assets, metadata, forbidden punctuation, keyboard focus and 200% text enlargement. External navigation is intercepted to verify its destination without depending on Telegram or GitHub.

To rerun browser checks, provide a Playwright installation with Chromium:

```sh
IMD_PLAYWRIGHT=/opt/imd-tools/playwright-mcp/node_modules/playwright/index.mjs \
PLAYWRIGHT_BROWSERS_PATH=/opt/imd-tools/ms-playwright \
node scripts/check-site.mjs
```

Those are the task's supplied tooling paths. For another environment, point `IMD_PLAYWRIGHT` at its Playwright `index.mjs` and `PLAYWRIGHT_BROWSERS_PATH` at its installed browsers, or install Playwright in the normal module search path. The test owns its local preview and closes it before exiting. Evidence is written to the ignored `test/scratch/validation/` directory.

The pinned probe was run with:

```sh
IMD_PLAYWRIGHT=/opt/imd-tools/playwright-mcp/node_modules/playwright/index.mjs \
PLAYWRIGHT_BROWSERS_PATH=/opt/imd-tools/ms-playwright \
node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

The probe and its pinned guides are task inputs, not site dependencies. Its screenshots were inspected. See [the consolidated review](artifacts/validation.md) for coverage, fixes and limits, and [DESIGN.md](DESIGN.md) for the final implementation.

**Limits:** WebKit was unavailable. The browser connector returned “Transport closed”, so browser review used the supplied Playwright Chromium directly. No physical device or screen reader session was performed. Text enlargement was tested, not native browser zoom. In the unmocked browser, both live endpoints returned `net::ERR_EMPTY_RESPONSE`; the dated fallback displayed correctly. The same public endpoints answered through the network research client. Mocked success checks establish the parsing and rendering behavior, not future API availability. The automated checks are worker observations, not independent certification.

## Files and maintenance

- `src/App.tsx`: proposal content, navigation and reusable presentation patterns.
- `src/data.ts`: source URLs, validated reads and fallback behavior.
- `src/swarm-snapshot.json`: the dated public IMD observation.
- `src/styles.css`: tokens, typography and responsive rules.
- `public/`: favicon, 1200 × 630 share image and the font license.
- `scripts/`: bounded preview, interaction validation and share image generation.

The share image is generated locally with `node scripts/make-social.mjs` using the same Playwright configuration. Rebuild after changing any runtime asset. Fonts are bundled locally from Fontsource; Geist is licensed under the [SIL Open Font License](public/FONT-LICENSE.txt).

The ignore file has an explicit four-pattern path budget: `**/node_modules/`, `**/.vite/`, `**/*.tsbuildinfo` and `/test/scratch/`. It excludes only installed dependencies, generated caches and disposable validation output. It does not ignore `dist/`. No dependency archives, package caches or submodules are part of the delivery.
