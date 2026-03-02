
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.4,
    topP: 0.85,
    maxOutputTokens: 1536,
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

    const prompt = `You are an expert AI Resume Optimizer. Rewrite ONLY bullet points, descriptions, and the summary to match the job description.

JOB DESCRIPTION:
"${(jobDescription || "Optimize for a standard professional role").substring(0, 3000)}"

CURRENT RESUME SECTIONS (JSON):
${JSON.stringify(writablePayload)}

STRICT RULES — DO NOT VIOLATE:
1. PRESERVE EXACTLY: company names, role titles, startDate, endDate, location, project titles, project links — copy them character-for-character from the input.
2. SAME COUNT: return exactly the same number of experience items and project items as in the input. Do not add or remove entries.
3. NO INVENTION: do not add fake metrics, technologies, or achievements not present in the input.
4. REWRITE ONLY: experience bullets (punchy, result-oriented, keyword-rich from the JD), project descriptions (highlight relevance to JD).
5. SKILLS: reorder/filter the provided skills list to prioritize JD keywords. Do not add skills not in the input.
6. SUMMARY: rewrite to pitch the candidate specifically for this role, based only on provided experience.

Return ONLY this JSON (no markdown fences, no extra keys):
{
  "summary": "string",
  "experience": [{ "company": "string", "role": "string", "startDate": "string", "endDate": "string", "location": "string", "bullets": ["string"] }],
  "projects": [{ "title": "string", "role": "string", "link": "string", "techStack": ["string"], "description": "string" }],
  "skills": ["string"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let aiOutput: any;
    try {
      aiOutput = JSON.parse(text);
    } catch {
      console.error("AI JSON Parse Error:", text.slice(0, 300));
      return NextResponse.json({ error: "AI failed to produce valid JSON" }, { status: 500 });
    }

    // Re-assemble: merge AI output back into the full resume, keeping static sections intact
    const optimizedContent = {
      ...current,
      personalInfo: {
        ...current.personalInfo,
        summary: aiOutput.summary || current.personalInfo?.summary || "",
      },
      experience: aiOutput.experience || current.experience,
      projects:   aiOutput.projects   || current.projects,
      skills:     (Array.isArray(aiOutput.skills) && aiOutput.skills.length > 0)
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
