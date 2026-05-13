---
name: startup-diligence-research
description: 'Use when researching startup due diligence, founder claim verification, hidden risk discovery, market/customer/financial/legal diligence, and producing an evidence-backed YAML diligence report with chapters, sections, tables, figures, and source-linked evidence claims.'
argument-hint: 'Target company, founder claims, sector/geography, URLs, and diligence scope'
---

# Startup Diligence Research

## What This Skill Produces

Create an internet-researched startup diligence report that verifies a founder's claims, uncovers hidden risks, and evaluates business fundamentals against the diligence checklist in `./references/checklist-map.yaml`.

The final deliverable must be a YAML report that conforms to `./assets/report-schema.yaml` and may start from `./assets/report-template.yaml`.

## Output Location

Store generated diligence reports directly under `./reports/`.

- Required YAML deliverable: `./reports/<target-slug>-diligence-report.yaml`, where `<target-slug>` is a lowercase, URL-safe version of the target company name, for example `./reports/openai-diligence-report.yaml`.
- Keep companion artifacts directly under `./reports/` using the same target slug prefix, such as `./reports/openai-diligence-report.html`, `./reports/openai-validation.log`, `./reports/openai-sources.yaml`, or `./reports/openai-figures.json`.
- Do not write final report files to the workspace root unless the user explicitly requests it.
- If a report file already exists, inspect it first and either update/resume it or create a dated filename such as `./reports/<target-slug>-YYYYMMDD-diligence-report.yaml` when the user wants a separate run.
- At the end of the task, tell the user the final report path and any companion artifact paths.

## When to Use

Use this skill for:

- Startup diligence research, investment memo support, or acquisition diligence.
- Verifying founder claims about revenue, customers, growth, market, product, traction, team, patents, legal matters, financing, or partnerships.
- Creating an evidence-backed report with chapters, sections, tables, figures, and source-linked claims.
- Finding hidden risks, contradictions, missing disclosures, and diligence follow-up questions.

## Required Inputs

Ask for missing inputs before deep research if they are not already provided:

1. Target company name, website, and known aliases.
2. Founder claims to verify, preferably as bullets or documents.
3. Sector, geography, stage, and business model.
4. Any supplied URLs, pitch deck excerpts, data room exports, financials, or customer references.
5. Desired depth: quick screen, standard diligence, or deep diligence.

If internet search or page-fetching tools are unavailable, ask the user for source URLs or produce a research backlog instead of inventing facts.

## Research Workflow

1. **Scope the assignment**
   - Normalize company name, subsidiaries, product names, founder names, and jurisdictions.
   - Convert each founder assertion into a numbered claim ledger.
   - Map claims to checklist chapters and sections from `./references/checklist-map.yaml`.

2. **Collect evidence from public sources**
   - Search company-owned sources: website, pricing pages, docs, case studies, blogs, press releases, security pages, privacy terms, job posts, support docs, app listings, and social profiles.
   - Search third-party sources: news, industry reports, customer reviews, app analytics, market databases, conference talks, podcasts, GitHub/open-source activity, patent databases, trademark databases, and professional profiles.
   - Search legal/regulatory sources where applicable: SEC/EDGAR, Companies House or local company registries, court dockets, UCC/lien records, bankruptcy records, sanctions lists, privacy/regulatory enforcement databases, FDA/FTC/FINRA/health/financial regulator databases, USPTO/EUIPO/WIPO, and environmental/safety records.
   - Search financing and cap-table signals: funding announcements, investor pages, accelerator pages, grants, debt announcements, SAFE/note references, valuation statements, and credible startup databases if accessible.
   - Respect source limits: do not bypass paywalls, private systems, or access controls. Mark inaccessible sources and evidence gaps.

3. **Create evidence claims**
   - Every material factual statement in the report must link to one or more `evidence_claims` entries.
   - Each evidence claim must include source IDs, quoted or paraphrased evidence, confidence, verification status, and associations to chapter, section, and any related tables or figures.
   - Separate observed facts from estimates, inferences, and analyst judgments.

4. **Analyze checklist coverage**
   - For each chapter and section, answer what public research can verify, contradict, or leave unresolved.
   - Identify evidence gaps where private data-room items are required, such as detailed financial statements, AR aging, cap table, debt instruments, supplier contracts, employee agreements, or customer contacts.
   - Use `not_publicly_verifiable` rather than speculating when checklist questions require private records.

5. **Build tables and figures**
   - Tables and figures are first-class deliverables, not optional decoration. Build them in parallel with section drafting, not after.
   - **Coverage minimum (MUST hold for every chapter I–VIII):**
     - At least **2 tables** per chapter, attached to specific sections via `chapter_id` and `section_id`.
     - At least **1 figure** per chapter, attached to a specific section.
     - Aim for an overall report total of roughly **15–25 tables and 8–12 figures** for a standard diligence depth; scale up for deep diligence and only down for quick screen (still no chapter with zero tables/figures).
     - **At least 3 of the figures must use `figure_type: chart`** so the report contains real quantitative visuals (e.g. funding/valuation trajectory, customer concentration bar, channel-mix bar, headcount trend, patent/publication trend). Do not let the report ship with only narrative figure types (timeline / market_map / org_chart) and zero charts.
   - **When evidence is thin, still build the artifact.** A table with three rows of `not_publicly_verifiable` plus the diligence-request column is more useful than no table. A figure showing only the publicly known events on a timeline (with gaps annotated) is more useful than no figure. Every chapter has *something* worth structuring. Same rule for charts: a 3-bar chart with two `not_publicly_verifiable` bars and one disclosed value is better than skipping the chart.
   - Use the per-chapter catalog in **"Required Table and Figure Coverage by Chapter"** below as the default starting set; add more when evidence supports it. Do not delete a row from the catalog without recording the reason in the section's `evidence_gaps` or in `limitations`.
   - Use tables for any structured finding: claim ledger, funding history, customer/logo lists, strategic-partner list, competitor comparison, pricing comparison, risk register, headcount trend, product matrix, patent/trademark list, legal-matter summary, regulatory-action summary, supplier dependency, leadership roster, public-hiring signal, etc.
   - Use figures for timelines, market maps, org/headcount charts, product architecture diagrams, fundraising timelines, customer concentration visuals, funnels, and risk heat maps.
   - For each figure, use the common figure envelope in `report_shape.figures`, set `figure_type`, and populate `spec` according to the matching `figure_spec_shapes.<figure_type>` entry in `./assets/report-schema.yaml`.
   - Each table and figure must reference `evidence_claim_ids` and `source_ids`, and each owning section must list the new `table_ids` / `figure_ids` in its arrays.

6. **Evaluate risks and fundamentals**
   - Rate risks by severity, likelihood, evidence strength, and diligence priority.
   - Cover at minimum: financial quality, revenue predictability, customer concentration, churn signals, market size/competition, pricing pressure, product maturity, technology defensibility, regulatory/legal exposure, IP ownership, founder/team credibility, hiring/turnover, financing runway, cap-table complexity, and operational dependencies.
   - Highlight contradictions between founder claims and public evidence.

7. **Produce final YAML report**
   - Output only YAML when the user asks for the final report.
   - When writing files, save the final YAML to `./reports/<target-slug>-diligence-report.yaml` and keep companion artifacts directly under `./reports/` with the same target slug prefix.
   - Follow `./assets/report-schema.yaml` exactly.
   - Include all checklist chapters even if a chapter has only gaps or follow-up questions.
   - Ensure chapters contain sections and sections reference their corresponding tables, figures, and evidence claims.

## Evidence Standards

Use these verification statuses:

- `verified`: Strong evidence supports the claim.
- `partially_verified`: Evidence supports part but not all of the claim.
- `contradicted`: Credible evidence conflicts with the claim.
- `unverified`: Searched but found no reliable evidence.
- `not_publicly_verifiable`: Requires private data-room records or direct confirmation.
- `inconclusive`: Evidence is mixed, stale, or low quality.

Use these confidence levels:

- `high`: Multiple credible primary or independent sources agree.
- `medium`: One credible primary source or several weaker sources support the point.
- `low`: Weak, stale, indirect, or single-source evidence.

## Required Table and Figure Coverage by Chapter

This catalog is the **default minimum**. Build every item unless the section truly has no signal at all (in which case still create a stub table/figure listing the diligence-request rows and mark `verification_status: not_publicly_verifiable`). Add more when evidence supports it.

### Chapter I — Financial Information
- Table: Public funding-round history (date, round, lead/participants, amount, post-money, source).
- Table: Capital structure / ownership snapshot (stakeholder, public position, diligence caveat).
- Table: Public revenue / ARR / unit-economic signals with verification status (or `not_publicly_verifiable` rows + private-data request).
- Figure: Funding timeline (`figure_type: timeline`).
- Figure: Implied valuation or post-money trajectory across rounds (`figure_type: chart`, `chart_type: line` or `bar`). If only one round is publicly priced, still chart it with `not_publicly_verifiable` markers for the others — the chart frames the diligence request.

### Chapter II — Products
- Table: Product / SKU matrix (product, audience, key features, public evidence, verification status).
- Table: Pricing comparison across tiers and against competitors where public.
- Figure: Product / dependency architecture diagram (`figure_type: architecture_diagram`).
- Figure (optional): Product release / roadmap timeline.

### Chapter III — Customer Information
- Table: Publicly known customers and case studies (customer, source, use case, public evidence, verification status).
- Table: Strategic relationships and partnerships (partner, nature, public evidence, gap).
- Table: Top-supplier / cloud-and-infra dependency (supplier, role, public evidence, concentration risk).
- Figure: Customer / partner concentration bar (`figure_type: chart`, `chart_type: bar`) showing the top accounts or partners by disclosed weight, even if most bars carry `not_publicly_verifiable`.
- Figure (optional): Customer / partner ecosystem map (`figure_type: market_map`).

### Chapter IV — Competition
- Table: Competitor comparison matrix (competitor, segment, funding, product overlap, differentiator, source).
- Table: Basis-of-competition scoring (axis, target's position, top competitors' position, evidence).
- Figure: Market map or 2x2 positioning (`figure_type: market_map` or `chart` `chart_type: scatter`).

### Chapter V — Marketing, Sales, and Distribution
- Table: Distribution channels and GTM motions (channel, region, public evidence, gap).
- Table: Public marketing-signal summary (campaigns, PR, owned-channel reach, partnerships).
- Figure: GTM funnel (`figure_type: funnel`) or channel-mix bar (`figure_type: chart`, `chart_type: bar`). Prefer the bar chart whenever channel weights are publicly disclosed; fall back to the funnel only when the source data is shaped as a true acquisition funnel.

### Chapter VI — Research and Development
- Table: Key R&D personnel / leadership and notable hires (name, role, background, source).
- Table: Public product / research pipeline (project, status, expected date, source, verification).
- Figure: R&D org chart or research-portfolio map (`figure_type: org_chart` or `architecture_diagram`).
- Figure (optional): Patent / publication trend over time (`figure_type: chart`).

### Chapter VII — Management and Personnel
- Table: Senior management roster (name, role, tenure, prior roles, source).
- Table: Headcount and hiring signals (function, region, public evidence, source).
- Table: Departures / turnover signals where public (name, role, departure date, source).
- Figure: Org chart (`figure_type: org_chart`).
- Figure: Headcount trend over time (`figure_type: chart`, `chart_type: line` or `bar`). Plot whatever public anchor points exist (LinkedIn employee counts, hiring announcements, layoffs); annotate undisclosed periods rather than dropping the chart.

### Chapter VIII — Legal and Related Matters
- Table: Pending lawsuits against the company (case, court, docket, filed date, status, source).
- Table: Pending lawsuits initiated by the company (defendant, court, docket, filed date, status, source).
- Table: Material IP — patents, trademarks, copyrights, key licenses (asset, jurisdiction, status, source).
- Table: Regulatory / agency actions (agency, action, date, status, source).
- Figure: Legal & regulatory timeline (`figure_type: timeline`).
- Figure: Risk heatmap covering the full risk register (`figure_type: risk_heatmap`).

## Privacy and Safety Rules

- Do not include private personal phone numbers, home addresses, personal emails, or non-public contact details.
- Prefer company-level or publicly listed business contact information.
- Do not present allegations as facts. Attribute legal, regulatory, or reputational concerns to specific sources and statuses.
- Date-stamp all research and flag stale evidence.

## Completion Checklist

Before finalizing, verify that:

- The report is valid YAML and follows `./assets/report-schema.yaml`.
- The report is saved under `./reports/<target-slug>-diligence-report.yaml`, unless the user explicitly requested another path.
- Every chapter from `./references/checklist-map.yaml` appears in the report.
- Every section has findings, evidence gaps, or follow-up questions.
- Every material claim references `evidence_claim_ids`.
- **Every chapter has at least 2 tables and 1 figure** attached to one of its sections via `chapter_id` and `section_id`. Run a final sweep that, for each chapter I–VIII, counts entries in `tables[]` and `figures[]` whose `chapter_id` matches; fix any chapter that fails the minimum before saving.
- Each section that owns a table or figure lists its `table_ids` / `figure_ids` in the section arrays (no orphans).
- The report total is roughly **15–25 tables and 8–12 figures** for standard diligence (scale up for deep diligence; never zero in any chapter).
- The catalog in "Required Table and Figure Coverage by Chapter" was followed; any catalog item that was deliberately skipped is justified in the section's `evidence_gaps` or in `limitations`.
- Every table and figure links to chapter, section, evidence claims, and sources.
- Every figure has a `spec` payload that matches its `figure_type`.
- Founder claims are classified by verification status.
- Hidden risks and unanswered diligence requests are clearly listed.
- Limitations and inaccessible sources are disclosed.
