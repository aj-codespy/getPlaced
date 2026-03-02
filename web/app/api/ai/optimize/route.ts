
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.2,        // Lowered from 0.4 — less creative = less hallucination
    topP: 0.85,
    maxOutputTokens: 2048,   // Increased slightly for larger resumes
  },
});

export async function POST(req: Request) {
  try {
    const { resumeId, jobDescription } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID required" }, { status: 400 });
    }

    // 1. Fetch only the writable sections from Firestore
    const resumeRef = doc(db, "resumes", resumeId);
    const resumeSnap = await getDoc(resumeRef);

    if (!resumeSnap.exists()) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const resumeData = resumeSnap.data();
    const current = resumeData.content;

    // Strip static sections — only send what the AI needs to rewrite
    const writablePayload = {
      experience: current.experience || [],
      projects:   current.projects   || [],
      skills:     current.skills     || [],
      summary:    current.personalInfo?.summary || "",
    };

    // Build a snapshot of the candidate's verified background for anti-hallucination
    const candidateSnapshot = [
      current.personalInfo?.headline ? `Headline: ${current.personalInfo.headline}` : "",
      current.education?.length ? `Education: ${current.education.map((e: Record<string, string>) => `${e.degree || ""} @ ${e.institution || ""}`).join("; ")}` : "",
      `Verified Skills: ${(current.skills || []).join(", ")}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are an expert AI Resume Optimizer. Rewrite ONLY bullet points, descriptions, and the summary to better match the job description.

CANDIDATE'S VERIFIED BACKGROUND (ground truth — do NOT contradict this):
${candidateSnapshot}

JOB DESCRIPTION:
"${(jobDescription || "Optimize for a standard professional role").substring(0, 3000)}"

CURRENT RESUME SECTIONS (JSON — this is the candidate's REAL data):
${JSON.stringify(writablePayload)}

ABSOLUTE RULES — VIOLATION IS UNACCEPTABLE:
1. PRESERVE EXACTLY (copy character-for-character): company names, role titles, startDate, endDate, location, project titles, project links, techStack arrays. Do NOT modify these fields AT ALL.
2. SAME COUNT: return EXACTLY the same number of experience items and project items as in the input. Do NOT add or remove entries.
3. NO INVENTION: Do NOT add fake metrics, technologies, user counts, performance numbers, or achievements that are not present or clearly implied by the input.
4. REWRITE ONLY these fields:
   - experience[].bullets: Make them punchy, result-oriented, using action verbs. Naturally incorporate JD keywords only where they truthfully apply.
   - projects[].description: Polish and highlight relevance to JD. Keep the core idea identical.
5. SKILLS: Reorder the PROVIDED skills list to prioritize JD-relevant ones. You may REMOVE irrelevant skills but do NOT ADD skills the candidate doesn't have.
6. SUMMARY: Rewrite to pitch for this role, based ONLY on the candidate's actual experience and skills.

ANTI-HALLUCINATION EXAMPLES:
- Input bullet: "Built a REST API for user management"
  BAD output: "Architected microservices handling 10M+ requests/day using AWS Lambda" (fabricated scale & tech)
  GOOD output: "Developed a RESTful API for user management, improving data access efficiency"
- Input: skills=["Python", "React", "MongoDB"]
  BAD output: skills=["Python", "React", "MongoDB", "Kubernetes", "TensorFlow"] (added non-existent skills)
  GOOD output: skills=["React", "Python", "MongoDB"] (reordered for JD relevance)

Return ONLY valid JSON (no markdown, no extra keys):
{
  "summary": "string",
  "experience": [{ "company": "string", "role": "string", "startDate": "string", "endDate": "string", "location": "string", "bullets": ["string"] }],
  "projects": [{ "title": "string", "role": "string", "link": "string", "techStack": ["string"], "description": "string" }],
  "skills": ["string"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let aiOutput: Record<string, unknown>;
    try {
      aiOutput = JSON.parse(text);
    } catch {
      console.error("AI JSON Parse Error:", text.slice(0, 300));
      return NextResponse.json({ error: "AI failed to produce valid JSON" }, { status: 500 });
    }

    // ── Validation: ensure AI didn't change entry counts ──────────────────────
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

    // Re-assemble: merge AI output back into the full resume, keeping static sections intact
    const optimizedContent = {
      ...current,
      personalInfo: {
        ...current.personalInfo,
        summary: (aiOutput.summary as string) || current.personalInfo?.summary || "",
      },
      experience: aiOutput.experience || current.experience,
      projects:   aiOutput.projects   || current.projects,
      skills:     (Array.isArray(aiOutput.skills) && (aiOutput.skills as string[]).length > 0)
                    ? aiOutput.skills
                    : current.skills,
    };

    // Update Firestore
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
