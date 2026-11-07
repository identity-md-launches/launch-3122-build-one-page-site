# Implemented design

## Overview

This page presents an opt in worker proposal to IMD seat holders and the IMD team. It uses a dark olive neutral palette, monospace headings, plain sans serif reading text and one pale lime action style. The visual idea is a set of separate agent identities, each leading to a traceable job receipt. The diagram is explicitly a proposed flow, not a claim that an integration already exists.

The first screen contains the proposal and its Telegram action. Below it, a network context strip leads into a numbered document. The desktop reading rail is navigation, not a second content hierarchy. Source links stay beside the claims they support.

## Colors

Canonical values are in `src/styles.css:1`. Components use semantic aliases of the neutral and lime primitives.

| Semantic token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#111310` | Page background and dark text on primary actions |
| `--color-surface` | `#191c17` | Command block and factual notes |
| `--color-border` | `#373e30` | Section dividers and command structure |
| `--color-text` | `#edf0e7` | Headings, primary text and emphasis |
| `--color-secondary` | `#b6bdaf` | Reading text and neutral statuses |
| `--color-muted` | `#929b89` | Captions, source dates and section numbers |
| `--color-action`, `--color-focus` | `#d8f59a` | Filled primary action and keyboard focus |
| `--color-action-hover` | `#e6ffb5` | Primary hover fill |
| `--color-on-action` | `#111310` | Primary action text |

The diagram has local neutral strokes and pale lime identity points in `IdentityDiagram`. Solid backgrounds make the text contrast measurable. The final taste probe found every measured text pair above its 4.5:1 normal or 3:1 large-text threshold. SVG artwork is not included in that automated result, so its label fill was measured separately against both rendered background colors: 9.68:1 against the page and 5.89:1 against a pattern dot. No additional light theme is implemented.

## Typography

`src/main.tsx` imports the Latin 400 and 600 faces of Geist and the Latin 400 face of Geist Mono through Fontsource. Production CSS references bundled WOFF2 and WOFF files. Browser inspection confirmed the three intended faces loaded.

| Role | Token and size | Face and behavior |
| --- | --- | --- |
| Captions and source dates | `--text-caption`, 13px | Geist 400, usually line height 1.6 |
| Links, table text and compact detail | `--text-small`, 14px | Geist 400; actions use 600 |
| Prose | `--text-body`, 16px | Geist 400, line height 1.6 |
| Subheadings | 16px; question group headings 20px | Geist Mono 400, line height 1.5 |
| Hero description | `--text-lead`, 20px; 16px below 35rem | Geist 400, line height 1.5 |
| Section headings and counts | `--text-heading`, 28px | Geist Mono 400; headings line height 1.3, counts 1.4 |
| Main heading | `--text-display`, 64px, then 48px below 65rem, then 40px below 35rem | Geist Mono 400, line height 1.12 |

Each viewport uses six sizes, including the single display size. There are two families and two weights. Display tracking is `-0.065em`; section headings use `-0.035em`; body text has natural tracking. Headings balance across lines. Prose is constrained by the article width and a 74-character maximum. Counts use tabular numbers and wrap rather than truncate. Code uses the 14px mono face. No text is made unselectable.

## Layout

The `.wrap` primitive provides shared alignment. Its maximum width is 1120px. Wide screens have a 96px total gutter budget, medium screens 64px, and narrow screens 40px. Spacing tokens are 8, 12, 16, 24, 32, 48, 64 and 80px. Small 4px gaps are used for closely associated caption and title details.

The hero is a two-column `1.4fr / 1fr` grid. The document uses a 200px reading rail, an 80px gap and a flexible article. Sections separate through space and a single structural rule. The worker explanation has two columns; the rollout is a three-column comparison table.

Implemented breakpoints in `src/styles.css`:

- At 65rem: display becomes 48px, rail becomes 170px, gaps narrow and command explanations move below their commands.
- At 49rem: the hero stacks, the rail becomes an ordinary two-column contents list, and the article occupies the full width.
- At 35rem: display becomes 40px, the worker explanation stacks, counts use two columns plus a full-width model row, and rollout rows become stacked comparisons with phase and timing above the details.

There are no fixed overlays. Desktop contents navigation sticks 32px from the top. Anchored sections have a 32px scroll margin. The content order in the DOM matches the requested reading order. Main actions remain in normal flow. Measured widths were 320, 390, 560, 784, 1040 and 1440px. Maximum safe integer counts and 200% text enlargement at 390px reflowed without horizontal scrolling.

## Elevation & Depth

The system is flat. There are no shadows, gradients or entrance effects. Surface tone groups factual notes and commands. Borders identify structural breaks. The only transition changes the primary action background over 150ms, and only when reduced motion is not requested.

## Shapes

Primary actions, command surfaces and SVG identity containers use 3px corners. Keyboard focus uses a 2px outline, with 5px offset or 4px around the primary action. Status dots are circular. The diagram uses repeated squares, diamonds and receipt shapes. No repeated container clips text or uses a fixed text height.

## Components

All presentation patterns live in `src/App.tsx`, with their styling in `src/styles.css`.

| Pattern | Use and behavior |
| --- | --- |
| `Section` | Numbered section with a stable anchor, `h2` and content region. Props: `id`, `number`, `title`, `children`. |
| `Source` | Named source link with a small decorative external arrow. Props: `href`, `children`. |
| `Arrow` | One 18px SVG stroke pattern; `diagonal` selects external direction. Hidden from assistive technology. |
| `IdentityDiagram` | Responsive SVG with an accessible title and description; figcaption identifies the diagram as proposed. |
| `NetworkCounts` | Named group of three real counts with source links, dated fallback labels, stable numeric typography and a polite completion announcement. Live state requires a successful validated request. |
| `Contents` | Native anchor navigation; an intersection observer sets `aria-current="location"` on the visible section. It becomes an inline list on narrow screens. |
| `.button.primary` | A native external link styled as the primary action. Minimum height 48px; hover changes fill; keyboard focus has a visible outline. |
| `.text-action` | Secondary navigation, minimum height 44px, without a competing filled surface. |
| `.rollout-table` | Phase, timing and holder outcome in one comparison. Native caption and row headings remain in the source; the narrow layout stacks each row. |
| `.command-block` | Named group of selectable proposed commands and explanations. It is not an input or executable control. |
| `.update-note`, `.resolved-question` | Neutral tonal notes that label factual updates in words. |
| `.rules-list`, `.question-list` | Ordered policy and open-question lists with consistent spacing. |

Links use native keyboard behavior. A visible-on-focus skip link precedes the header. No dialogs, menus, forms, wallet controls or custom button keyboard handlers are needed. There is no loading spinner: dated values are immediately useful while the single read is pending. Failures settle into the same explicitly dated state.

## Do's and Don'ts

- Reuse `.wrap`, `Section` and the semantic tokens for additional proposal content.
- Keep prose in Geist and headings, short code and numeric data in Geist Mono.
- Use one filled action per visible action group; keep secondary actions as links.
- Put source dates and links next to changing claims. Preserve the distinction between proposal, live data and snapshots.
- Let data and commands wrap. Do not abbreviate or clip identity formats, source labels or counts.
- Keep provider claims sourced and proposed behavior labeled. Do not introduce installation, signing or claim flows on this page.

To add a related section, create one `Section` after the relevant content, add its anchor to `sections`, use the existing type and spacing tokens, and check it at 320 and 390px before rebuilding the export.

Design review used the pinned Better Interface guide, adapted from [Jakub Krehel's Better Interface](https://github.com/jakubkrehel/skills/tree/267330e1adfc66a718fb65fa6918c1f06d0a689e/skills/better-interface), MIT. The documentation method is adapted from [Paul Bakaus's Impeccable document reference](https://github.com/pbakaus/impeccable/blob/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8/skill/reference/document.md), Apache-2.0. These references informed review and documentation; their implementation files are not bundled into the site.
