---
description: |
  Tracks token usage for completed agent workflows, calculates estimated model
  cost, and posts one cost report on the linked pull request or an issue.

on:
  workflow_dispatch:
    inputs:
      run_id:
        description: "Completed workflow run ID to inspect"
        required: true
        type: string
  workflow_run:
    workflows: ["Repo Status", "Weekly Research", "Random Unicorn Diligence Report"]
    types:
      - completed
    branches:
      - main

permissions:
  actions: read
  contents: read
  issues: read
  pull-requests: read

network: defaults

safe-outputs:
  add-comment:
    target: "*"
  create-issue:
    title-prefix: "[cost-tracker] "
    labels: [automation, cost]
    max: 2

tools:
  agentic-workflows:
  github:
    toolsets: [default]
  bash: true

timeout-minutes: 60

---

# Agent Cost Tracker

Calculate the cost of the triggering agent workflow run and report it once.

## Run Context

- **Repository**: ${{ github.repository }}
- **Target run ID**: ${{ github.event.workflow_run.id || inputs.run_id }}
- **Trigger**: ${{ github.event_name }}

## 1. Fetch Logs

Call `agentic-workflows` `logs` for only this run:

- `after_run_id`: ${{ github.event.workflow_run.id || inputs.run_id }} - 1
- `before_run_id`: ${{ github.event.workflow_run.id || inputs.run_id }} + 1
- `count`: 1

If there is no matching run or no downloaded log directory, exit silently.

## 2. Find Usage

Check this structured file first:

```text
/tmp/gh-aw/aw-mcp/logs/run-${{ github.event.workflow_run.id || inputs.run_id }}/sandbox/firewall/logs/api-proxy-logs/token-usage.jsonl
```

If it is not there, search the downloaded run directory:

```sh
find "/tmp/gh-aw/aw-mcp/logs/run-${{ github.event.workflow_run.id || inputs.run_id }}" \
  \( -path '*/api-proxy-logs/token-usage.jsonl' -o -name 'token-usage.jsonl' -o -name 'agent_usage.json' \) \
  -type f -print
```

Use the first structured source with nonzero usage. Expected fields:

```json
{"model":"gpt-5.5","input_tokens":1200,"output_tokens":340,"cache_read_input_tokens":500,"cache_creation_input_tokens":100}
```

If no structured usage exists, estimate from the final `Tokens` footer in `agent-stdio.log`:

```text
Tokens    ↑ 6.0m • ↓ 45.5k • 5.4m (cached) • 15.6k (reasoning)
```

Parse `k` and `m` suffixes. Treat `↑` as total input, `↓` as output, and
`(cached)` as cache-read input. Since cached tokens are included in `↑`, use
`input_tokens = max(input_total - cached_tokens, 0)`. Infer the model from
`sandbox/agent/logs/process-*.log`, `sandbox/firewall/audit/docker-compose.redacted.yml`,
or run metadata. Mark footer-based reports as estimates.

If all sources report zero tokens, exit silently.

## 3. Calculate Cost

Aggregate token counts by model across all lines. Use this pricing table (USD per 1M tokens):

| Model | Input | Output | Cache write | Cache read |
|-------|-------|--------|-------------|------------|
| claude-opus-4.7 | $5.00 | $25.00 | $6.25 | $0.50 |
| claude-opus-4.6 | $5.00 | $25.00 | $6.25 | $0.50 |
| claude-opus-4.5 | $5.00 | $25.00 | $6.25 | $0.50 |
| claude-opus-4.1 | $15.00 | $75.00 | $18.75 | $1.50 |
| claude-opus-4 | $15.00 | $75.00 | $18.75 | $1.50 |
| claude-sonnet-4.6 | $3.00 | $15.00 | $3.75 | $0.30 |
| claude-sonnet-4.5 | $3.00 | $15.00 | $3.75 | $0.30 |
| claude-sonnet-4 | $3.00 | $15.00 | $3.75 | $0.30 |
| claude-sonnet-3.7 | $3.00 | $15.00 | $3.75 | $0.30 |
| claude-haiku-4.5 | $1.00 | $5.00 | $1.25 | $0.10 |
| claude-haiku-3.5 | $0.80 | $4.00 | $1.00 | $0.08 |
| gpt-5.5 | $5.00 | $30.00 | — | $0.50 |
| gpt-5.5-pro | $30.00 | $180.00 | — | — |
| gpt-5.4 | $2.50 | $15.00 | — | $0.25 |
| gpt-5.4-mini | $0.75 | $4.50 | — | $0.075 |
| gpt-5.4-nano | $0.20 | $1.25 | — | $0.02 |
| gpt-5.4-pro | $30.00 | $180.00 | — | — |
| gpt-5.3-codex | $1.75 | $14.00 | — | $0.175 |
| gpt-5.2 | $1.75 | $14.00 | — | $0.175 |
| gpt-5.2-pro | $21.00 | $168.00 | — | — |
| gpt-5.1 | $1.25 | $10.00 | — | $0.125 |
| gpt-5 | $1.25 | $10.00 | — | $0.125 |
| gpt-5-mini | $0.25 | $2.00 | — | $0.025 |
| gpt-5-nano | $0.05 | $0.40 | — | $0.005 |
| gpt-5-pro | $15.00 | $120.00 | — | — |
| gpt-4.1 | $2.00 | $8.00 | — | $0.50 |
| gpt-4.1-mini | $0.40 | $1.60 | — | $0.10 |
| gemini-3.1-pro | $2.00 | $12.00 | — | — |
| gemini-3.1-flash-lite | $0.25 | $1.50 | — | — |
| gemini-3-flash | $0.50 | $3.00 | — | — |
| gemini-2.5-pro | $1.25 | $10.00 | — | — |
| gemini-2.5-flash | $0.30 | $2.50 | — | — |
| gemini-2.5-flash-lite | $0.10 | $0.40 | — | — |
| gemini-1.5-pro | $1.25 | $5.00 | — | — |
| gemini-2.0-flash | $0.10 | $0.40 | — | — |

Use `0` for `—`. For unknown models, use `$3.00` input, `$15.00` output, and `0` for cache rates.

```text
cost = (input_tokens * input_rate
  + output_tokens * output_rate
  + cache_creation_input_tokens * cache_write_rate
  + cache_read_input_tokens * cache_read_rate) / 1_000_000
```

Total cost is the sum across models. Format as `$0.0123`; use `< $0.0001` below that threshold.

## 4. Post Report

Read the matching workflow run's `pull_requests`, `run_number`, `html_url`, and `conclusion` fields. Set:

- `$TARGET_RUN_LINK`: `[#RUN_NUMBER](HTML_URL)`, or `run TARGET_RUN_ID` if unavailable
- `$RUN_LABEL`: `#RUN_NUMBER`, or `TARGET_RUN_ID` if unavailable
- `$RUN_CONCLUSION`: the matching run conclusion, or `${{ github.event.workflow_run.conclusion || 'unknown' }}`

If linked to a PR, post one `add_comment`; otherwise create one issue.

```markdown
## Agent run cost

| | |
|---|---|
| **Run** | $TARGET_RUN_LINK |
| **Conclusion** | $RUN_CONCLUSION |
| **Total cost** | $TOTAL_COST |

<details>
<summary>Token breakdown by model</summary>

| Model | Input | Output | Cache write | Cache read | Cost |
|-------|------:|------:|------------:|-----------:|-----:|
[one row per model]

</details>

*Data source: token-usage.jsonl from api-proxy logs. Footer-based reports are estimates from agent-stdio.log.*
```

Issue title when no PR is linked:

```text
[cost-tracker] $RUN_LABEL: $TOTAL_COST
```

## 5. Alert

If total cost exceeds `$1.00`, create a second issue titled:

```text
[cost-tracker] High spend alert for run $RUN_LABEL: $TOTAL_COST
```

## Rules

- Exit silently for missing logs, missing usage, zero tokens, or transient artifact failures.
- Do not create more than one normal report per run.
- Double-check arithmetic before posting.
