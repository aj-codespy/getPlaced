
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { safeJsonParse } from "@/lib/safe-json";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type ParseSource = "json_text" | "docx_upload";

type ParseErrorCode =
  | "missing_api_key"
  | "invalid_input"
  | "unsupported_file_type"
  | "file_too_large"
  | "docx_extract_failed"
  | "resume_text_too_short"
  | "ai_generation_failed"
  | "json_invalid"
  | "unknown";

type ParseFixture = {
  primary: string;
  repair?: string;
};

type ParseInput = {
  resumeText: string;
  source: ParseSource;
  fixture?: ParseFixture;
};

type GenerativeModelLike = {
  generateContent: (
    prompt: string,
  ) => Promise<{
    response: {
      text: () => string;
    };
  }>;
};

// Parse is a pure extraction task — no creativity needed.
// gemini-2.5-flash is used for extraction.
function getModel() {
  if (!GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1, // Near-zero: extraction should be deterministic
      maxOutputTokens: 4096,
    },
  });
}

class ResumeParseError extends Error {
  code: ParseErrorCode;
  status: number;

  constructor(code: ParseErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function toStringValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((v) => hasMeaningfulValue(v));
  if (value && typeof value === "object") {
    return Object.values(value).some((v) => hasMeaningfulValue(v));
  }
  return Boolean(value);
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => toStringValue(v))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const merged: string[] = [];
    for (const key of ["technical", "tools", "soft"]) {
      const part = obj[key];
      if (Array.isArray(part)) {
        merged.push(...part.map((v) => toStringValue(v)).filter(Boolean));
      } else if (typeof part === "string") {
        merged.push(...part.split(/[\n,]/).map((v) => v.trim()).filter(Boolean));
      }
    }
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const item of merged) {
      const k = item.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        deduped.push(item);
      }
    }
    return deduped;
  }
  return [];
}

function normalizeParsedData(raw: Record<string, unknown>): Record<string, unknown> {
  const personalInfoRaw =
    raw.personalInfo && typeof raw.personalInfo === "object"
      ? (raw.personalInfo as Record<string, unknown>)
      : {};

  const personalInfo = {
    fullName: toStringValue(personalInfoRaw.fullName),
    email: toStringValue(personalInfoRaw.email),
    phone: toStringValue(personalInfoRaw.phone),
    linkedin: toStringValue(personalInfoRaw.linkedin),
    github: toStringValue(personalInfoRaw.github),
    portfolio: toStringValue(personalInfoRaw.portfolio),
    summary: toStringValue(personalInfoRaw.summary),
  };

  const education = (Array.isArray(raw.education) ? raw.education : [])
    .map((entry) => {
      const e = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
      return {
        school: toStringValue(e.school || e.institution || e.name),
        degree: toStringValue(e.degree),
        fieldOfStudy: toStringValue(e.fieldOfStudy || e.field || e.major),
        startDate: toStringValue(e.startDate),
        endDate: toStringValue(e.endDate || e.graduationDate),
        grade: toStringValue(e.grade || e.score || e.gpa),
      };
    })
    .filter((e) => hasMeaningfulValue(e));

  const experience = (Array.isArray(raw.experience) ? raw.experience : [])
    .map((entry) => {
      const e = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
      const bullets = Array.isArray(e.bullets)
        ? e.bullets.map((b) => toStringValue(b)).filter(Boolean)
        : [];
      const description =
        toStringValue(e.description || e.summary) || (bullets.length > 0 ? bullets.join("\n") : "");
      return {
        company: toStringValue(e.company),
        position: toStringValue(e.position || e.role || e.jobTitle || e.title),
        location: toStringValue(e.location),
        startDate: toStringValue(e.startDate),
        endDate: toStringValue(e.endDate),
        description,
      };
    })
    .filter((e) => hasMeaningfulValue(e));

  const projects = (Array.isArray(raw.projects) ? raw.projects : [])
    .map((entry) => {
      const p = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
      const techRaw = p.technologies || p.techStack || p.tech;
      const technologies = Array.isArray(techRaw)
        ? techRaw.map((t) => toStringValue(t)).filter(Boolean).join(", ")
        : toStringValue(techRaw);
      return {
        name: toStringValue(p.name || p.title),
        description: toStringValue(p.description),
        technologies,
        link: toStringValue(p.link || p.url),
      };
    })
    .filter((p) => hasMeaningfulValue(p));

  const certifications = (Array.isArray(raw.certifications) ? raw.certifications : [])
    .map((entry) => {
      if (typeof entry === "string") {
        return {
          name: entry.trim(),
          issuer: "",
          date: "",
        };
      }
      const c = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
      return {
        name: toStringValue(c.name || c.title),
        issuer: toStringValue(c.issuer || c.organization),
        date: toStringValue(c.date || c.issueDate),
      };
    })
    .filter((c) => hasMeaningfulValue(c.name));

  return {
    personalInfo,
    education,
    experience,
    projects,
    skills: normalizeStringArray(raw.skills),
    certifications,
  };
}

function normalizeResumeText(input: string): string {
  return (input || "").replace(/[ \t]{2,}/g, " ").trim();
}

function readTestFixture(raw: unknown): ParseFixture | undefined {
  if (process.env.NODE_ENV !== "test") return undefined;
  if (!raw || typeof raw !== "object") return undefined;
  const candidate = raw as Record<string, unknown>;
  const primary = typeof candidate.primary === "string" ? candidate.primary : "";
  if (!primary.trim()) return undefined;
  const repair = typeof candidate.repair === "string" ? candidate.repair : undefined;
  return { primary, repair };
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return normalizeResumeText(result.value || "");
  } catch {
    throw new ResumeParseError(
      "docx_extract_failed",
      "Could not extract text from DOCX. Please upload a valid .docx resume.",
      400,
    );
  }
}

async function extractParseInput(req: Request): Promise<ParseInput> {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const fileValue = formData.get("file");
    if (!(fileValue instanceof File)) {
      throw new ResumeParseError(
        "invalid_input",
        "Missing resume file. Please upload a .docx file.",
        400,
      );
    }

    if (fileValue.size > MAX_UPLOAD_BYTES) {
      throw new ResumeParseError(
        "file_too_large",
        "Uploaded file is too large. Please keep it under 8MB.",
        400,
      );
    }

    const lowerName = fileValue.name.toLowerCase();
    const lowerType = (fileValue.type || "").toLowerCase();
    const isDocx = lowerName.endsWith(".docx") || lowerType === DOCX_MIME;

    if (!isDocx) {
      throw new ResumeParseError(
        "unsupported_file_type",
        "Unsupported file type. Please upload a .docx file.",
        400,
      );
    }

    const resumeText = await extractDocxText(fileValue);
    if (resumeText.length < 50) {
      throw new ResumeParseError(
        "resume_text_too_short",
        "Resume content is too short or unreadable after DOCX extraction.",
        400,
      );
    }

    return { resumeText: resumeText.substring(0, 12000), source: "docx_upload" };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ResumeParseError("invalid_input", "Invalid JSON body.", 400);
  }

  if (!body || typeof body !== "object") {
    throw new ResumeParseError("invalid_input", "Invalid request payload.", 400);
  }

  const payload = body as Record<string, unknown>;
  const resumeText = normalizeResumeText(
    typeof payload.resumeText === "string" ? payload.resumeText : "",
  );

  if (resumeText.length < 50) {
    throw new ResumeParseError("resume_text_too_short", "Resume text is too short or empty.", 400);
  }

  return {
    resumeText: resumeText.substring(0, 12000),
    source: "json_text",
    fixture: readTestFixture(payload.__aiFixture),
  };
}

function buildParsePrompt(resumeText: string): string {
  return `Extract structured data from this resume text into the JSON schema below.
Use empty string "" for missing text fields and [] for missing arrays.
Keep grades in their original format (e.g. "8.5/10", "3.8 GPA"). Do not convert scales.

RESUME TEXT:
"""
${resumeText}
"""

JSON SCHEMA:
{
  "personalInfo": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string",
    "summary": "string"
  },
  "education": [
    { "school": "string", "degree": "string", "fieldOfStudy": "string", "startDate": "YYYY-MM", "endDate": "YYYY-MM or Present", "grade": "string" }
  ],
  "experience": [
    { "company": "string", "position": "string", "location": "string", "startDate": "YYYY-MM", "endDate": "YYYY-MM or Present", "description": "string" }
  ],
  "projects": [
    { "name": "string", "description": "string", "technologies": "string", "link": "string" }
  ],
  "skills": ["string"],
  "certifications": [
    { "name": "string", "issuer": "string", "date": "string" }
  ]
}`;
}

async function generateContentText(model: GenerativeModelLike, prompt: string): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch {
    throw new ResumeParseError(
      "ai_generation_failed",
      "AI failed to generate parse output. Please try again.",
      502,
    );
  }
}

async function parseModelOutput(
  model: GenerativeModelLike | null,
  primaryOutput: string,
  repairOverride?: string,
): Promise<Record<string, unknown>> {
  try {
    return safeJsonParse(primaryOutput);
  } catch {
    if (repairOverride) {
      try {
        return safeJsonParse(repairOverride);
      } catch {
        throw new ResumeParseError(
          "json_invalid",
          "AI returned invalid JSON after repair. Please retry.",
          502,
        );
      }
    }

    if (!model) {
      throw new ResumeParseError(
        "json_invalid",
        "AI returned invalid JSON and no repair fixture was provided.",
        502,
      );
    }

    const repairPrompt = `Fix this malformed JSON so it is valid strict JSON.
Return ONLY the repaired JSON object and nothing else.

MALFORMED JSON:
"""
${primaryOutput.substring(0, 7000)}
"""`;
    const repairedOutput = await generateContentText(model, repairPrompt);
    try {
      return safeJsonParse(repairedOutput);
    } catch {
      throw new ResumeParseError(
        "json_invalid",
        "AI returned invalid JSON after repair. Please retry.",
        502,
      );
    }
  }
}

function toParseError(error: unknown): ResumeParseError {
  if (error instanceof ResumeParseError) return error;

  const message = error instanceof Error ? error.message : "Failed to parse resume";
  if (/invalid json/i.test(message)) {
    return new ResumeParseError("json_invalid", message, 502);
  }
  return new ResumeParseError("unknown", message, 500);
}

async function recordParseTelemetry(input: {
  source: ParseSource;
  success: boolean;
  errorCode?: ParseErrorCode;
}) {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
    const [{ db }, firestore] = await Promise.all([
      import("@/lib/firebase/config"),
      import("firebase/firestore"),
    ]);

    const { doc, increment, serverTimestamp, setDoc } = firestore;
    const dateKey = new Date().toISOString().split("T")[0];
    const payload: Record<string, unknown> = {
      attempts: increment(1),
      updatedAt: serverTimestamp(),
      [`sources.${input.source}`]: increment(1),
    };

    if (input.success) {
      payload.successes = increment(1);
    } else {
      payload.failures = increment(1);
      payload[`errorTypes.${input.errorCode || "unknown"}`] = increment(1);
    }

    await setDoc(doc(db, "resume_parse_telemetry", dateKey), payload, { merge: true });
  } catch (telemetryError) {
    console.error("Resume Parse Telemetry Error:", telemetryError);
  }
}

export async function POST(req: Request) {
  let source: ParseSource = "json_text";
  try {
    const input = await extractParseInput(req);
    source = input.source;
    const model = input.fixture ? null : getModel();

    if (!input.fixture && !model) {
      throw new ResumeParseError(
        "missing_api_key",
        "Resume parsing is temporarily unavailable (missing GEMINI_API_KEY).",
        500,
      );
    }

    const prompt = buildParsePrompt(input.resumeText);
    const primaryOutput = input.fixture
      ? input.fixture.primary
      : await generateContentText(model as GenerativeModelLike, prompt);

    const parsedData = await parseModelOutput(model as GenerativeModelLike | null, primaryOutput, input.fixture?.repair);
    await recordParseTelemetry({ source, success: true });
    return NextResponse.json({ success: true, data: normalizeParsedData(parsedData) });
  } catch (e: unknown) {
    const parseError = toParseError(e);
    await recordParseTelemetry({ source, success: false, errorCode: parseError.code });
    console.error("Resume Parse Error:", e);
    return NextResponse.json({ error: parseError.message }, { status: parseError.status });
  }
}
