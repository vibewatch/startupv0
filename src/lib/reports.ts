import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, 'reports');

export type DiligenceReport = Record<string, any>;

export type ReportSummary = {
  slug: string;
  fileName: string;
  filePath: string;
  title: string;
  company: string;
  sector: string;
  stage: string;
  geography: string;
  researchDate: string;
  thesis: string;
  assessment: string;
  risk: string;
  sourceCount: number;
  riskCount: number;
  chapterCount: number;
  diligenceDepth: string;
  recommendation: string;
  rating: string;
};

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    return [] as string[];
  }
  return fs
    .readdirSync(REPORTS_DIR)
    .filter((name) => /\.(ya?ml)$/i.test(name))
    .sort();
}

function slugFromFileName(fileName: string) {
  return fileName
    .replace(/\.(ya?ml)$/i, '')
    .replace(/-?diligence-?report$/i, '')
    .replace(/-?report$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function readReportFile(fileName: string): DiligenceReport {
  const filePath = path.join(REPORTS_DIR, fileName);
  return YAML.parse(fs.readFileSync(filePath, 'utf8')) as DiligenceReport;
}

export function summarizeReport(report: DiligenceReport, fileName: string): ReportSummary {
  const meta = report.report_metadata ?? {};
  const scope = report.research_scope ?? {};
  const executive = report.executive_summary ?? {};
  const risks = Array.isArray(report.risk_register) ? report.risk_register : [];
  const sources = Array.isArray(report.sources) ? report.sources : [];
  const chapters = Array.isArray(report.chapters) ? report.chapters : [];
  const risk = highestRisk(risks);

  return {
    slug: slugFromFileName(fileName),
    fileName,
    filePath: path.join('reports', fileName),
    title: String(meta.report_title ?? 'Startup Diligence Report'),
    company: String(meta.target_company ?? slugFromFileName(fileName)),
    sector: String(meta.sector ?? 'Private-market diligence'),
    stage: String(meta.company_stage ?? 'Private company'),
    geography: String(meta.geography ?? ''),
    researchDate: String(meta.research_date ?? ''),
    thesis: String(executive.investment_or_diligence_thesis ?? executive.overall_assessment ?? ''),
    assessment: String(executive.overall_assessment ?? ''),
    risk,
    sourceCount: sources.length,
    riskCount: risks.length,
    chapterCount: chapters.length,
    diligenceDepth: String(scope.diligence_depth ?? 'diligence'),
    recommendation: recommendationFromReport(report),
    rating: ratingFromReport(report),
  };
}

export function getAllReports() {
  return ensureReportsDir()
    .map((fileName) => {
      const report = readReportFile(fileName);
      return { summary: summarizeReport(report, fileName), report };
    })
    .sort((a, b) => String(b.summary.researchDate).localeCompare(String(a.summary.researchDate)) || a.summary.company.localeCompare(b.summary.company));
}

export function getReportBySlug(slug: string) {
  return getAllReports().find((entry) => entry.summary.slug === slug);
}

export function getTopRisks(report: DiligenceReport, limit = 6) {
  const risks = Array.isArray(report.risk_register) ? report.risk_register : [];
  const severityRank: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, informational: 1 };
  const likelihoodRank: Record<string, number> = { high: 4, medium: 3, low: 2, unknown: 1 };
  return [...risks]
    .sort((a, b) => {
      const sev = (severityRank[String(b.severity).toLowerCase()] ?? 0) - (severityRank[String(a.severity).toLowerCase()] ?? 0);
      if (sev !== 0) return sev;
      return (likelihoodRank[String(b.likelihood).toLowerCase()] ?? 0) - (likelihoodRank[String(a.likelihood).toLowerCase()] ?? 0);
    })
    .slice(0, limit);
}

export function getExecutiveBullets(report: DiligenceReport): {
  items: { label: string; value: string }[];
  gaps: string[];
  next: string[];
} {
  const executive = report.executive_summary ?? {};
  const items: { label: string; value: string }[] = [];
  if (executive.overall_assessment) items.push({ label: 'Assessment', value: String(executive.overall_assessment) });
  if (executive.investment_or_diligence_thesis) items.push({ label: 'Diligence thesis', value: String(executive.investment_or_diligence_thesis) });
  const gaps = Array.isArray(executive.key_evidence_gaps) ? executive.key_evidence_gaps.slice(0, 5).map(String) : [];
  const next = Array.isArray(executive.recommended_next_steps) ? executive.recommended_next_steps.slice(0, 5).map(String) : [];
  return { items, gaps, next };
}

export function getChapterSections(chapter: any): any[] {
  return Array.isArray(chapter?.sections) ? chapter.sections : [];
}

export function getTableRows(table: any): any[] {
  return Array.isArray(table?.rows) ? table.rows : [];
}

export type ExhibitIndex = {
  tablesBySection: Map<string, any[]>;
  figuresBySection: Map<string, any[]>;
  tablesByChapter: Map<string, any[]>;
  figuresByChapter: Map<string, any[]>;
  placedTableIds: Set<string>;
  placedFigureIds: Set<string>;
};

function pushTo<T>(map: Map<string, T[]>, key: string, value: T) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

export function indexExhibits(report: DiligenceReport): ExhibitIndex {
  const tables = Array.isArray(report.tables) ? report.tables : [];
  const figures = Array.isArray(report.figures) ? report.figures : [];
  const tablesBySection = new Map<string, any[]>();
  const figuresBySection = new Map<string, any[]>();
  const tablesByChapter = new Map<string, any[]>();
  const figuresByChapter = new Map<string, any[]>();
  for (const table of tables) {
    const chapterId = String(table?.chapter_id ?? '').trim();
    const sectionId = String(table?.section_id ?? '').trim();
    if (chapterId && sectionId) pushTo(tablesBySection, `${chapterId}|${sectionId}`, table);
    else if (chapterId) pushTo(tablesByChapter, chapterId, table);
  }
  for (const figure of figures) {
    const chapterId = String(figure?.chapter_id ?? '').trim();
    const sectionId = String(figure?.section_id ?? '').trim();
    if (chapterId && sectionId) pushTo(figuresBySection, `${chapterId}|${sectionId}`, figure);
    else if (chapterId) pushTo(figuresByChapter, chapterId, figure);
  }
  return {
    tablesBySection,
    figuresBySection,
    tablesByChapter,
    figuresByChapter,
    placedTableIds: new Set<string>(),
    placedFigureIds: new Set<string>(),
  };
}

export function exhibitKey(chapterId: unknown, sectionId: unknown) {
  return `${String(chapterId ?? '').trim()}|${String(sectionId ?? '').trim()}`;
}

function highestRisk(risks: any[]) {
  const order = ['critical', 'high', 'medium', 'low', 'informational'];
  const values = risks.map((risk) => String(risk.severity ?? '').toLowerCase());
  return order.find((value) => values.includes(value)) ?? 'unknown';
}

function recommendationFromReport(report: DiligenceReport) {
  const risk = highestRisk(Array.isArray(report.risk_register) ? report.risk_register : []);
  if (risk === 'critical') return 'Research more';
  if (risk === 'high') return 'Track';
  if (risk === 'medium') return 'Track';
  return 'Review';
}

function ratingFromReport(report: DiligenceReport) {
  const risks = Array.isArray(report.risk_register) ? report.risk_register : [];
  const chapters = Array.isArray(report.chapters) ? report.chapters : [];
  const sources = Array.isArray(report.sources) ? report.sources : [];
  const severityPenalty: Record<string, number> = { critical: 1.2, high: 0.7, medium: 0.35, low: 0.1 };
  const penalty = risks.reduce((sum, risk) => sum + (severityPenalty[String(risk.severity).toLowerCase()] ?? 0.2), 0);
  const evidenceBonus = Math.min(1.4, sources.length / 30);
  const coverageBonus = Math.min(1.0, chapters.length / 10);
  const score = Math.max(1, Math.min(9.5, 5.8 + evidenceBonus + coverageBonus - penalty / 4));
  return score.toFixed(1);
}

export function humanize(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value).replace(/_/g, ' ');
}

export function sentence(value: unknown, fallback = 'No public summary available.') {
  const text = String(value ?? '').trim();
  return text.length ? text : fallback;
}
