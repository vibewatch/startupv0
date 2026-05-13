---
description: |
  Minimal smoke test for the safe-outputs create-pull-request flow. The agent
  writes a single tiny YAML file under reports/ and the safe-outputs job opens
  a draft PR. If this works, the write/PR pipeline is healthy; if it fails, the
  failure is isolated from the long-running diligence workflow.

on:
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

# engine:
#   id: copilot
#   model: claude-sonnet-4.6

tools:
  web-fetch:
  cache-memory: true

safe-outputs:
  create-pull-request:
    title-prefix: "[write-test] "
    draft: true
    labels: [test, automated]

timeout-minutes: 10
---

# Write-to-Reports Smoke Test (Using OpenAI as Template)

Read the existing `reports/openai-diligence-report.yaml`, create a fake test report by changing the slug/metadata, and write it. Open a draft PR with the result. This tests the write+safe-outputs pipeline in isolation.

## Steps

1. Generate a unique slug: `write-test-$(date -u +%Y%m%d-%H%M%S)`. Call it `<slug>`.

2. Read the first 100 lines of `reports/openai-diligence-report.yaml` to understand its structure:


3. Create `reports/<slug>.yaml` by:
   - Reading the openai template structure.
   - Copying the exact format but replacing the top-level fields (company_name, slug, etc.) with test values.

4. Open a draft PR via safe-outputs:
   - Branch: `write-test/<slug>`
   - Title: `[write-test] <slug>`
   - Body: `Smoke test for safe-outputs create-pull-request pipeline. Reads openai template, writes fake report, opens PR.`
   - Files: only `reports/<slug>.yaml`.

## Rules

- **Exact structure.** Match the openai template's YAML format closely (keys, nesting, field names).
