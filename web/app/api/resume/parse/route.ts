
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Parse is a pure extraction task — no creativity needed.
// gemini-2.0-flash-lite is the cheapest model and perfectly capable of structured extraction.
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.1,   // Near-zero: extraction should be deterministic
    maxOutputTokens: 2048,
  },
});

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json({ error: "Resume text is too short or empty." }, { status: 400 });
    }

    // Cap input at 12000 chars — beyond that, the resume is unusually long and
    // the extra tokens rarely add useful structured data.
    const truncated = resumeText.substring(0, 12000);

    const prompt = `Extract structured data from this resume text into the JSON schema below.
Use empty string "" for missing text fields and [] for missing arrays.
Keep grades in their original format (e.g. "8.5/10", "3.8 GPA"). Do not convert scales.

RESUME TEXT:
"""
${truncated}
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

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsedData = JSON.parse(text);

    return NextResponse.json({ success: true, data: parsedData });

  } catch (e: unknown) {
    console.error("Resume Parse Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to parse resume" }, { status: 500 });
  }
}
