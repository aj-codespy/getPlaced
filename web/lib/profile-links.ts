export interface ResumeLink {
  label: string;
  url: string;
}

type PersonalInfo = Record<string, unknown> | undefined;

const KEYWORD_PRIORITIES: Array<{ label: string; keywords: string[] }> = [
  { label: "Kaggle", keywords: ["data scientist", "data science", "machine learning", "ml", "analytics", "ai"] },
  { label: "LeetCode", keywords: ["leetcode", "dsa", "algorithms", "competitive programming", "coding challenge"] },
  { label: "GitHub", keywords: ["software", "backend", "frontend", "full stack", "developer", "engineer"] },
  { label: "Portfolio", keywords: ["designer", "product", "ux", "ui", "portfolio", "creative"] },
  { label: "LinkedIn", keywords: ["manager", "consultant", "business", "operations", "sales", "marketing"] },
];

const DEFAULT_RANK = ["LinkedIn", "Portfolio", "GitHub", "LeetCode", "Kaggle"];

function normalizeUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeLabel(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function buildCandidateLinks(personalInfo: PersonalInfo): ResumeLink[] {
  if (!personalInfo) return [];

  const links: ResumeLink[] = [];
  const pushLink = (label: string, rawUrl: unknown) => {
    const url = normalizeUrl(rawUrl);
    if (!url) return;
    links.push({ label, url });
  };

  pushLink("LinkedIn", personalInfo.linkedin);
  pushLink("GitHub", personalInfo.github);
  pushLink("Portfolio", personalInfo.portfolio);
  pushLink("LeetCode", personalInfo.leetcode);
  pushLink("Kaggle", personalInfo.kaggle);

  if (Array.isArray(personalInfo.additionalLinks)) {
    for (const link of personalInfo.additionalLinks) {
      if (!link || typeof link !== "object") continue;
      const label = normalizeLabel((link as Record<string, unknown>).platform);
      const url = normalizeUrl((link as Record<string, unknown>).url);
      if (!label || !url) continue;
      links.push({ label, url });
    }
  }

  // Dedupe by URL while preserving earlier canonical entries.
  const seen = new Set<string>();
  return links.filter((l) => {
    const key = l.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function selectDisplayLinks(
  personalInfo: PersonalInfo,
  targetText: string,
  maxLinks = 4
): ResumeLink[] {
  const candidates = buildCandidateLinks(personalInfo);
  if (!candidates.length) return [];

  const text = (targetText || "").toLowerCase();

  const score = (label: string): number => {
    const normalized = label.trim().toLowerCase();
    const directIndex = DEFAULT_RANK.findIndex((x) => x.toLowerCase() === normalized);
    let points = directIndex === -1 ? 1 : 20 - directIndex;

    for (const rule of KEYWORD_PRIORITIES) {
      if (rule.label.toLowerCase() !== normalized) continue;
      if (rule.keywords.some((k) => text.includes(k))) points += 25;
    }

    // Strong defaults even without JD.
    if (normalized === "linkedin") points += 12;
    if (normalized === "portfolio") points += 10;
    if (normalized === "github") points += 9;
    return points;
  };

  return [...candidates]
    .sort((a, b) => score(b.label) - score(a.label))
    .slice(0, maxLinks);
}
