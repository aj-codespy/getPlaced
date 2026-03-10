
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { selectDisplayLinks } from "@/lib/profile-links";
import { safeJsonParse } from "@/lib/safe-json";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.25,
    topP: 0.85,
    maxOutputTokens: 4096,
  },
});

const ACTION_VERBS = [
  "Led", "Developed", "Created", "Managed", "Designed", "Implemented", "Optimized",
  "Achieved", "Improved", "Increased", "Launched", "Integrated", "Collaborated",
  "Engineered", "Architected", "Analyzed", "Built", "Delivered", "Deployed",
  "Automated", "Streamlined", "Accelerated", "Reduced", "Generated",
  "Spearheaded", "Coordinated", "Mentored", "Scaled", "Migrated",
  "Refactored", "Established", "Transformed", "Executed", "Facilitated",
  "Authored", "Contributed", "Shipped", "Drove", "Pioneered"
];

export async function POST(req: Request) {
  try {
    const { resumeId, jobDescription } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID required" }, { status: 400 });
    }

    const resumeRef = doc(db, "resumes", resumeId);
    const resumeSnap = await getDoc(resumeRef);

    if (!resumeSnap.exists()) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const resumeData = resumeSnap.data();
    const current = resumeData.content;

    const writablePayload = {
      experience: current.experience || [],
      projects:   current.projects   || [],
      skills:     current.skills     || [],
      summary:    current.personalInfo?.summary || "",
    };

    // Build candidate snapshot for anti-hallucination
    const candidateSnapshot = [
      current.personalInfo?.headline ? `Headline: ${current.personalInfo.headline}` : "",
      current.education?.length ? `Education: ${current.education.map((e: Record<string, string>) => `${e.degree || ""} @ ${e.institution || ""}`).join("; ")}` : "",
      `Verified Skills: ${(current.skills || []).join(", ")}`,
    ].filter(Boolean).join("\n");

    const verbList = ACTION_VERBS.slice(0, 20).join(", ");

    const prompt = `You are an expert AI Resume Optimizer specializing in ATS-optimized resumes that score 90+ on automated resume scanners. Rewrite the content to maximize ATS score.

CANDIDATE'S VERIFIED BACKGROUND:
${candidateSnapshot}

JOB DESCRIPTION:
"${(jobDescription || "Optimize for a standard professional role").substring(0, 3000)}"

CURRENT RESUME (JSON):
${JSON.stringify(writablePayload)}

MANDATORY OUTPUT REQUIREMENTS (each is critical for ATS scoring):

SUMMARY (40-60 words, 2-3 sentences):
- Start with strong descriptor: "Results-driven", "Detail-oriented", "Innovative"
- Mention 2+ specific technical skills from candidate's actual skill set
- Include at least 1 quantifiable element ("2+ years", "multiple projects", "5+ applications")
- End each sentence with a period

EXPERIENCE BULLETS (exactly 4 per entry, 15-25 words each):
- Each bullet MUST start with a DIFFERENT action verb from: ${verbList}
- NEVER use "Responsible for", "Worked on", "Helped with"  
- At least 2 of 4 bullets MUST have a quantifiable metric (%, users, X+, $)
- Include ATS keywords naturally: api, scalable, performance, agile, data, cloud, architecture, end-to-end
- Pattern: [Action Verb] + [What] + [Technology] + [Metric/Impact]

PROJECT DESCRIPTIONS (20-35 words) + BULLETS (exactly 3 per project, 12-22 words each):
- At least 1 bullet per project MUST have a metric
- Must reference actual techStack

SKILLS (10-15 items):
- Reorder to prioritize JD-relevant skills first
- Keep at least 70% from candidate's existing skills
- May add clearly inferable standard skills

PRESERVATION RULES:
- Copy character-for-character: company, role, startDate, endDate, location, title, link, techStack
- Same number of experience and project entries
- Do NOT invent technologies or achievements

Return ONLY valid JSON:
{
  "summary": "string",
  "experience": [{ "company": "string", "role": "string", "startDate": "string", "endDate": "string", "location": "string", "bullets": ["string", "string", "string", "string"] }],
  "projects": [{ "title": "string", "role": "string", "link": "string", "techStack": ["string"], "description": "string", "bullets": ["string", "string", "string"] }],
  "skills": ["string"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let aiOutput: Record<string, unknown>;
    try {
      aiOutput = safeJsonParse(text);
    } catch {
      console.error("AI JSON Parse Error. Attempting repair:", text.slice(0, 300));
      const repaired = await model.generateContent(`Fix this malformed JSON so it becomes valid strict JSON.
Return ONLY JSON.

MALFORMED JSON:
"""
${text.substring(0, 7000)}
"""`);
      aiOutput = safeJsonParse(repaired.response.text());
    }

    // ── Post-Generation Validation ────────────────────────────────────────────
    const inputExpCount = (current.experience || []).length;
    const outputExpCount = (Array.isArray(aiOutput.experience) ? aiOutput.experience : []).length;
    const inputProjCount = (current.projects || []).length;
    const outputProjCount = (Array.isArray(aiOutput.projects) ? aiOutput.projects : []).length;

    if (outputExpCount !== inputExpCount) {
      console.warn(`AI changed experience count: ${inputExpCount} → ${outputExpCount}. Using original.`);
      aiOutput.experience = current.experience;
    }
    if (outputProjCount !== inputProjCount) {
      console.warn(`AI changed project count: ${inputProjCount} → ${outputProjCount}. Using original.`);
      aiOutput.projects = current.projects;
    }

    // Ensure minimum bullets per entry
    if (Array.isArray(aiOutput.experience)) {
      for (const exp of aiOutput.experience as Record<string, unknown>[]) {
        if (!Array.isArray(exp.bullets) || (exp.bullets as string[]).length < 3) {
          exp.bullets = (exp.bullets as string[] || []).concat([
            "Contributed to team deliverables and project milestones using modern development practices.",
            "Collaborated with cross-functional teams to deliver high-quality solutions on schedule."
          ]).slice(0, 4);
        }
      }
    }

    // Re-assemble
    const optimizedContent = {
      ...current,
      personalInfo: {
        ...current.personalInfo,
        summary: (aiOutput.summary as string) || current.personalInfo?.summary || "",
        displayLinks: selectDisplayLinks(current.personalInfo || {}, jobDescription || "", 4),
      },
      experience: aiOutput.experience || current.experience,
      projects:   aiOutput.projects   || current.projects,
      skills:     (Array.isArray(aiOutput.skills) && (aiOutput.skills as string[]).length > 0)
                    ? aiOutput.skills
                    : current.skills,
    };

    await updateDoc(resumeRef, {
      content:     optimizedContent,
      targetRole:  jobDescription ? "Tailored Role" : resumeData.targetRole,
      isOptimized: true,
      updatedAt:   serverTimestamp(),
    });

    return NextResponse.json({ success: true, data: optimizedContent });

  } catch (e: unknown) {
    console.error("Optimization Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
