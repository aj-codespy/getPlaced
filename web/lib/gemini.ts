import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.4,
    topP: 0.85,
    maxOutputTokens: 2048,
  },
});

export async function generateResumeContent(profile: any, targetJobDescription: string = "") {
  // Strip static sections — only send what the AI needs to rewrite
  const { personalInfo, education, achievements, certifications, publications, ...writableProfile } = profile;

  const prompt = `You are an expert ATS Resume Writer. Rewrite ONLY the sections provided for the target role.

TARGET ROLE: "${targetJobDescription || "General Professional"}"

INPUT (JSON):
${JSON.stringify({
  experience: writableProfile.experience || [],
  projects:   writableProfile.projects   || [],
  skills:     writableProfile.skills     || [],
})}

RULES:
- Experience bullets: 3-5 per role, strong action verbs, quantify results.
- Projects: 2-3 impactful lines highlighting tech and outcome.
- Skills: filter/reorder to prioritize keywords from the target role.
- Summary: 3-line professional summary tailored to the target role.

Return ONLY this JSON:
{
  "summary": "string",
  "experience": [{ "company": "string", "role": "string", "duration": "string", "bullets": ["string"] }],
  "projects": [{ "name": "string", "description": "string", "technologies": "string", "bullets": ["string"] }],
  "skills": ["string"],
  "achievements": ["string"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const aiOutput = JSON.parse(text);

    // Re-assemble: inject static sections back
    return {
      ...aiOutput,
      personalInfo: {
        ...personalInfo,
        summary: aiOutput.summary || personalInfo?.summary || "",
      },
      education:      education      || [],
      achievements:   aiOutput.achievements || achievements || [],
      certifications: certifications || [],
      publications:   publications   || [],
    };
  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
}
