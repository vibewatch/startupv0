# AGENTS.md

Astro 6 static site rendering YAML diligence reports from [reports/](reports/). Node ≥22.12. No backend, no tests.

## Commands
- `npm run dev` — local dev
- `npm run build` — type-check + build to `dist/`. Use to validate any change.

## Must-know conventions
- **Design tokens only.** Use CSS vars from [src/styles/global.css](src/styles/global.css) (`var(--cream-base)`, `var(--charcoal)`, `var(--space-5)`, …). No raw hex, no pure white. Full system: [DESIGN.md](DESIGN.md).
- **Two font weights:** 400 and 600. Display font is `var(--font-display)` (Mona Sans).
- **Borders, not shadows,** for containment. Only signature shadow is `var(--button-inset)` on dark CTAs.
- **Reports load at build time** via [src/lib/reports.ts](src/lib/reports.ts); slug is filename minus `-diligence-report`. To add a report, drop a YAML in `reports/` and rebuild.
- **Trailing-slash URLs** (`/archive/`, `/${slug}/`) — Astro default; keep them.

## Generating new reports
Use the skill at [.agents/skills/startup-diligence-research/SKILL.md](.agents/skills/startup-diligence-research/SKILL.md). Output to `reports/<slug>-diligence-report.yaml`.
