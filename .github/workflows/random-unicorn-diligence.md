---
description: |
  Weekly workflow that randomly picks a startup unicorn not already covered in
  the reports/ folder, performs internet research using the
  startup-diligence-research skill, and opens a pull request adding a new
  evidence-backed YAML diligence report under reports/.

on:
  schedule: weekly
  workflow_dispatch:

permissions: read-all

network:
  allowed:
    - defaults
    # Search & read-through fetch proxy
    - duckduckgo.com           # html.duckduckgo.com search endpoint
    - r.jina.ai                # reader proxy: fetch arbitrary pages as text
    - web.archive.org          # Wayback Machine snapshots + /wayback/available API
    - archive.org              # Internet Archive (covers wayback-api.archive.org)
    # Reference / lists
    - wikipedia.org
    - wikimedia.org
    # Startup / funding databases
    - crunchbase.com
    - cbinsights.com
    - pitchbook.com
    - dealroom.co
    - tracxn.com
    - growjo.com
    - owler.com
    # Business & tech press
    - techcrunch.com
    - theinformation.com
    - reuters.com
    - bloomberg.com
    - ft.com
    - wsj.com
    - forbes.com
    - cnbc.com
    - axios.com
    - businessinsider.com
    - sifted.eu
    - theverge.com
    - wired.com
    - arstechnica.com
    # Regulatory / filings
    - sec.gov
    - courtlistener.com
    # Hiring & employee signals
    - linkedin.com
    - glassdoor.com
    - levels.fyi
    - teamblind.com
    - repvue.com
    # Community signals
    - news.ycombinator.com
    - hn.algolia.com

engine:
  id: copilot
  model: claude-sonnet-4.6

tools:
  web-fetch:
  cache-memory: true

safe-outputs:
  create-pull-request:
    title-prefix: "[unicorn-diligence] "
    draft: true
    labels: [diligence, automated]
  missing-tool:
    create-issue: true

timeout-minutes: 30
---

# Random Unicorn Diligence Report

Pick one private startup unicorn not already covered in `reports/`, produce a new diligence report, and open a draft PR.

## Steps

1. Pick a target unicorn.
  - Build covered slugs from `reports/*-diligence-report.yaml` (strip suffix) plus `/tmp/gh-aw/cache-memory/recently-attempted.json`.
  - Fetch one or more current unicorn lists from reputable public sources (Wikipedia, CB Insights, etc.). Use `web-fetch`; for search use `https://html.duckduckgo.com/html/?q=...` or `https://r.jina.ai/https://...`.
  - Build at least 30 candidates.
  - Normalize each candidate slug: lowercase, ASCII, non-alphanumerics replaced with `-`.
  - Drop covered candidates, then pick one remaining candidate at random (`shuf -n 1`).
  - Skip companies that already IPO'd, were acquired, or shut down.

2. Research and write the report.
  - Run the skill at [.agents/skills/startup-diligence-research/SKILL.md](.agents/skills/startup-diligence-research/SKILL.md) end-to-end at standard depth.
  - Output file: `reports/<slug>-diligence-report.yaml`.
  - No human is available for skill prompts. Infer from public evidence or mark evidence gaps.
  - Never fabricate.

3. Open the draft PR.
  - Append `<slug>` to `/tmp/gh-aw/cache-memory/recently-attempted.json` (create as `[]` if missing; keep only the last 200 entries).
  - Open a draft PR via `create-pull-request`:
    - Branch: `unicorn-diligence/<slug>`
    - Title: `[unicorn-diligence] Add diligence report for <Company Name>`
    - Body: short summary with company, sector, country, latest valuation, and top 3 risks.
    - Files: only `reports/<slug>-diligence-report.yaml` (companion artifacts allowed only under `reports/` with the same `<slug>` prefix).

## Rules

- Keep exactly one target company per run.
- If no usable unicorn list can be fetched, or no uncovered candidates remain, create a `missing-tool` issue and exit.
- Do not produce a report without real public evidence.