
// ── Section keys that can appear in a resume ──────────────────────────────────
export type ResumeSection =
  | "summary"       // personalInfo.summary
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "achievements"
  | "certifications"
  | "publications";

// ── Per-template section config ───────────────────────────────────────────────
// `sections` = ordered list of sections this template renders.
// Only these sections will be included in the generated data and preview.
export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  type: "standard" | "premium";
  thumbnail: string;
  sections: ResumeSection[];
}

export const RESUME_TEMPLATES: TemplateConfig[] = [
  // ── Standard (Free) ──────────────────────────────────────────────────────────
  {
    id: "classic",
    name: "Classic",
    description: "A clean, timeless serif layout suitable for all industries.",
    type: "standard",
    thumbnail: "/templates/classic.png",
    sections: ["summary", "experience", "projects", "education", "skills", "achievements", "certifications", "publications"],
  },
  {
    id: "business",
    name: "Business",
    description: "Professional layout optimized for corporate and management roles.",
    type: "standard",
    thumbnail: "/templates/business.png",
    sections: ["summary", "experience", "projects", "education", "skills", "achievements", "certifications", "publications"],
  },
  {
    id: "creative",
    name: "Creative",
    description: "Distinctive design with sidebar and visual flair for creative fields.",
    type: "standard",
    thumbnail: "/templates/creative.png",
    sections: ["summary", "experience", "projects", "education", "skills", "achievements", "certifications", "publications"],
  },
  {
    id: "experienced",
    name: "Experienced",
    description: "Dense, detailed layout designed for professionals with extensive history.",
    type: "standard",
    thumbnail: "/templates/experienced.png",
    sections: ["summary", "experience", "projects", "education", "skills", "achievements", "certifications", "publications"],
  },

  // ── Premium (Paid) ───────────────────────────────────────────────────────────
  {
    id: "modern",
    name: "Modern",
    description: "Sleek, sans-serif design with accent colors for a contemporary look.",
    type: "premium",
    thumbnail: "/templates/modern.png",
    sections: ["summary", "experience", "projects", "education", "skills", "achievements", "certifications", "publications"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, Swiss-style typography with ample whitespace. Design-focused.",
    type: "premium",
    thumbnail: "/templates/minimal.png",
    sections: ["summary", "experience", "projects", "education", "skills", "achievements", "certifications", "publications"],
  },
  {
    id: "compact",
    name: "Compact",
    description: "High-density single-page layout. Perfect for technical resumes.",
    type: "premium",
    thumbnail: "/templates/compact.png",
    sections: ["summary", "skills", "experience", "projects", "education", "achievements", "certifications", "publications"],
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Refined, prestige look with rich typography and subtle accents.",
    type: "premium",
    thumbnail: "/templates/elegant.png",
    sections: ["summary", "experience", "education", "projects", "skills", "achievements", "certifications", "publications"],
  },
  {
    id: "ivy",
    name: "Ivy League",
    description: "Academic prestige format. Prioritizes education and publications.",
    type: "premium",
    thumbnail: "/templates/ivy.png",
    sections: ["summary", "education", "publications", "experience", "projects", "skills", "achievements", "certifications"],
  },
  {
    id: "scholar",
    name: "Scholar",
    description: "Research-centric layout with bibliographic formatting for publications.",
    type: "premium",
    thumbnail: "/templates/scholar.png",
    sections: ["summary", "education", "skills", "publications", "experience", "projects", "achievements", "certifications"],
  },
  {
    id: "tech",
    name: "Tech",
    description: "Optimized for software engineers. Grid layout for skills and projects.",
    type: "premium",
    thumbnail: "/templates/tech.png",
    sections: ["summary", "skills", "projects", "experience", "education", "achievements", "certifications", "publications"],
  },
  {
    id: "impact",
    name: "Impact",
    description: "Elite consulting style. Maximum content density and strict formatting.",
    type: "premium",
    thumbnail: "/templates/impact.png",
    sections: ["summary", "experience", "projects", "education", "publications", "skills", "achievements", "certifications"],
  },
];

// ── Helper: get sections for a template id ────────────────────────────────────
export function getTemplateSections(templateId: string): ResumeSection[] {
  const t = RESUME_TEMPLATES.find((t) => t.id === templateId);
  // Default to all sections if template not found
  return t?.sections ?? ["summary", "experience", "projects", "education", "skills", "achievements", "certifications", "publications"];
}

// ── Resume data shape (loose — fields are optional since data comes from AI/Firestore) ──
export interface ResumeData {
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    summary?: string;
    headline?: string;
    [key: string]: string | undefined;
  };
  experience?: unknown[];
  projects?: unknown[];
  education?: unknown[];
  skills?: unknown[];
  achievements?: unknown[];
  certifications?: unknown[];
  publications?: unknown[];
  [key: string]: unknown;
}

// ── Helper: filter resume data to only include sections the template uses ─────
export function filterResumeDataForTemplate(data: ResumeData, templateId: string): ResumeData {
  if (!data) return data;
  const sections = getTemplateSections(templateId);

  const hasSummary = sections.includes("summary");

  return {
    personalInfo: {
      ...data.personalInfo,
      // Only include summary if the template renders it
      summary: hasSummary ? (data.personalInfo?.summary ?? "") : "",
    },
    experience:     sections.includes("experience")     ? (data.experience     ?? []) : [],
    projects:       sections.includes("projects")       ? (data.projects       ?? []) : [],
    education:      sections.includes("education")      ? (data.education      ?? []) : [],
    skills:         sections.includes("skills")         ? (data.skills         ?? []) : [],
    achievements:   sections.includes("achievements")   ? (data.achievements   ?? []) : [],
    certifications: sections.includes("certifications") ? (data.certifications ?? []) : [],
    publications:   sections.includes("publications")   ? (data.publications   ?? []) : [],
  };
}

