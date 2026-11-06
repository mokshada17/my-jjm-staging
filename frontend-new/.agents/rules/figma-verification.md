# Figma Design Fidelity & Mandatory Verification Rule

## Core Directive
Before making ANY changes to UI components, pages, layouts, tables, styling, or navigation in this project, you MUST first verify the source Figma design completely. We require exact visual and structural parity with the design—zero approximations.

## Reference Source
- **Figma Design URL**: `https://www.figma.com/design/jCK1R0xWTY970W51MjeK2V/Untitled`
  (file key `jCK1R0xWTY970W51MjeK2V`. The older key `yGIHly9Geo1hJwYw1Fedt6` is superseded.)
- **Figma Tree Specification**: `JJM_Dashboard/figma_tree.json` is **empty (0 bytes)** and has never
  been populated. Do not treat it as a source of truth until it is.
- **REST API access**: `/v1/files/*` and `/v1/images/*` are **paywalled on the Figma Starter plan**
  — they return HTTP 429 with `x-figma-plan-tier: starter` and a `Retry-After` of several days.
  A valid token is not sufficient. Either use a paid plan, or export the node tree with a Figma
  plugin (plugins run client-side and are not subject to the REST paywall).
- **Design tokens live in the file itself**: frames `2:16797` (Style Guide — Dark Theme Colors),
  `2:17016` (Light Theme Colors) and `2:17236` (Typography). Prefer these over any list in docs.

## Frame IDs
Frames use the `2:*` namespace. Every screen has a Light and a Dark variant.

| Screen | Dark | Light |
|---|---|---|
| Login | `2:14812` | `2:14912` |
| Portal Landing | `2:14590` | `2:14367` |
| Enterprise Dashboard | `2:352` | `2:10` |
| Region Dashboard / Overview | `2:2289` / `2:3135` | `2:3809` / `2:688` |
| Circle Dashboard / Overview | `2:2693` / `2:1824` | `2:1382` / `2:2056` |
| Division Dashboard / Overview | `2:4212` / `2:7856` | `2:6148` / `2:5916` |
| Sub-Division Dashboard / Overview | `2:4640` / `2:5460` | `2:6577` / `2:7396` |
| Block Dashboard / Overview | `2:5059` / `2:5690` | `2:6996` / `2:7628` |
| Scheme Dashboard / Overview | `2:10744` / `2:12808` | `2:10246` / `2:13040` |
| Village Dashboard / Overview | `2:11238` / `2:12151` | `2:13270` / `2:12393` |
| ESR Dashboard / Overview | `2:11688` / `2:12632` | `2:13722` / `2:14188` |

## Mandatory Invariants
1. **Pre-Change Verification**:
   - Always identify the exact Figma frame ID corresponding to the page or component being modified before editing code.
   - Inspect frame layers, hierarchy, text values, layout modes, paddings, borders, colors, and badge styles.
2. **Exact Visual Fidelity**:
   - Use the design tokens in `tailwind.config.js` (`jjm-*`). They were verified on 2026-09-22
     against the Style Guide frames **and** the actual fills in `2:352` / `2:10`.

     | Token | Value | Role |
     |---|---|---|
     | `jjm-canvas` | `#0E1526` | page canvas, card bodies |
     | `jjm-surface` | `#1C2D54` | elevated value tiles |
     | `jjm-border` | `#293E66` | the dominant stroke |
     | `jjm-scrubber` | `#0B0E2D` | bottom time bar |
     | `jjm-cyan` | `#24D2FF` | primary accent |
     | `jjm-blue-light` | `#1E6B8A` | light-theme primary accent |
     | `jjm-green` / `jjm-red` / `jjm-amber` | `#10B981` / `#EF4444` / `#F59E0B` | status, shared by both themes |
     | `jjm-light-bg` / `jjm-light-surface` | `#EDF4F9` / `#F1F5F9` | light-theme page and tiles |

     > **Superseded:** earlier revisions of this file listed `#000B2A`, `#0E1B38`, `#16274E`,
     > `#00E63D`, `#FFAA00`, `#FF4D4D`. Those are **not** in the design — `#000B2A` appears
     > exactly once in frame `2:352` versus 67 uses of `#0E1526`. Only `#24D2FF` was correct.
     > Do not reintroduce them.

   - Prefer the tokens over raw hex so a palette correction stays a one-file change.
   - Retain exact table column definitions, card groupings, and sensor metrics. Do NOT remove or approximate elements.
3. **UI Components**:
   - Use **shadcn/ui** primitives from `src/shared/components/ui` (`Card`, `Table`, `Badge`,
     `Button`, `Separator`, `Tooltip`). Add more with `npx shadcn@latest add <name>` —
     `components.json` is configured. Do NOT hand-roll replacements for these primitives.
   - `Card` already resolves `bg-card` / `border` to the verified tokens, so it needs no colour overrides.
4. **Navigation & Breadcrumbs Alignment**:
   - Breadcrumb navigation must follow the Figma prototype hierarchy (the state tab -> `/dashboard`, the other tiers -> respective Overview pages `/dashboard/:tier/overview`, row clicks -> Detail Dashboards `/dashboard/:tier/:id`). The state tab (Figma's "Maharashtra") is also the state picker.
5. **Post-Change Validation**:
   - Always run `npm run build` and `npm run test:run` to verify TypeScript and test integrity.
   - Capture browser screenshots to verify pixel parity with Figma.
   - An HTTP 200 on a route does **not** prove the page renders — CSS compile failures still
     return 200 for the HTML. Request the CSS module too, or check the browser overlay.
   - After editing `tailwind.config.js`, restart the dev server (and clear `node_modules/.vite`);
     Vite does not reliably re-read it for the PostCSS plugin, which surfaces as a bogus
     "class does not exist" error.

## Known design-side defects
These typos are in the Figma and are mirrored in code for parity. Fix them in Figma, then re-sync:
`LiIter Per Capita Day` (capital i), `Achiving or not achiving`, `>55 LCPD`, `Water Comption`,
and the run-together timestamps `10/11/20242:16:44PM`.
