---
description: |
  Workflow that runs every 2 hours and randomly picks three startup unicorns not already
  covered in the reports/ folder, performs internet research for each in parallel using the
  startup-diligence-research skill, and opens a pull request adding new evidence-backed YAML
  diligence reports under reports/.

on:
  schedule: every 2 hours
  workflow_dispatch:

permissions: read-all

env:
  COPILOT_PROVIDER_WIRE_API: responses

network:
  allowed:
    - defaults
    # Search & read-through fetch proxy
    - duckduckgo.com           # html.duckduckgo.com search endpoint
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
    # Additional diligence targets / source domains
    - doctolib.com
    - doctolib.fr
    - clickhouse.com
    - huggingface.co
    - apple.com
    - ltx.studio
    - popularpays.com
    - tech.eu
    - justia.com
    - businesswire.com
    - lightricks.com
    - pappers.fr
    - prnewswire.com
    - ashbyhq.com
    - distyl.ai
    - forgeglobal.com
    - lsvp.com
    - openai.com
    - jina.ai
    - brave.com
    - uspto.gov
    - uspto.report
    - applyboard.com
    - astronomer.io
    - channeldive.com
    - delltechnologiescapital.com
    - ecosia.org
    - globenewswire.com

engine:
  id: copilot
  model: gpt-5.5
  args:
    - --effort
    - xhigh
    - --autopilot

tools:
  web-fetch:
  bash: true

safe-outputs:
  create-pull-request:
    title-prefix: "[unicorn-diligence] "
    draft: true
    labels: [diligence, automated]
  missing-tool:
    create-issue: true

timeout-minutes: 360
---

# Random Unicorn Diligence Reports

Pick three private startup unicorns not already covered in `reports/`, produce new diligence reports in parallel, and open a draft PR.

## Steps

1. Pick three eligible target unicorns.
  - Build an existing-report exclusion list from `reports/*-diligence-report.yaml` by stripping the suffix.
  - Fetch current unicorn lists from reputable public sources (Wikipedia, CB Insights, etc.) and build a candidate list with company name, normalized slug, latest known valuation, and unicorn-status source. Use `web-fetch`; for search use `https://html.duckduckgo.com/html/?q=...` or `https://r.jina.ai/https://...`.
  - Keep only candidates whose slug is not in the existing-report exclusion list and that have not IPO'd, been acquired, or shut down.
  - Pick three candidates at random (`shuf -n 3`); if research later fails eligibility, replace that company with another uncovered eligible candidate.

2. Research and write the reports in parallel.
  - For each selected company, run the skill at [.agents/skills/startup-diligence-research/SKILL.md](.agents/skills/startup-diligence-research/SKILL.md) end-to-end at standard depth in a separate parallel work stream.
  - Start all three research work streams before completing any one full report, and keep each company's notes, evidence, source list, and risk analysis separate.
  - Output file: `reports/<slug>-diligence-report.yaml`.
  - No human is available for skill prompts. Infer from public evidence or mark evidence gaps.
  - Never fabricate.

3. Open the draft PR.
  - Open a draft PR via `create-pull-request`:
    - Branch: `unicorn-diligence/<slug-1>-<slug-2>-<slug-3>`
    - Title: `[unicorn-diligence] Add diligence reports for 3 unicorns`
    - Body: short summary table with company, sector, country, latest valuation, and top 3 risks for each company.
    - Files: only `reports/<slug>-diligence-report.yaml` for the three selected companies (companion artifacts allowed only under `reports/` with the same matching `<slug>` prefixes).

## Rules

- Keep exactly three target companies per run.
- If no usable unicorn list can be fetched, or fewer than three uncovered eligible candidates remain, create a `missing-tool` issue and exit.
- Do not produce a report without real public evidence.