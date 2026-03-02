
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Text-only path: use flash-lite (cheapest)
const textModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.3,
    maxOutputTokens: 1024, // Audit output is small — scores + short strings
  },
});

// Vision path (images attached): needs a multimodal model
const visionModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.3,
    maxOutputTokens: 1024,
  },
});

// Shared prompt template — keeps both paths consistent
function buildPrompt(profileText: string): string {
  return `You are an expert LinkedIn Profile Coach. Analyze the LinkedIn profile below and return a strict JSON report.

PROFILE:
"""
${profileText}
"""

Return ONLY this JSON structure:
{
  "overallScore": number (0-100),
  "headline": { "score": number, "feedback": "string", "suggestion": "string" },
  "about": { "score": number, "feedback": "string", "suggestion": "string" },
  "experience": { "score": number, "feedback": "string", "suggestion": "string" },
  "skills": { "score": number, "feedback": "string", "missingKeywords": ["string"] },
  "actionItems": ["string (top 3 priority fixes)"]
}`;
}

export async function POST(req: Request) {
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { profileText, images } = await req.json();
    const hasImages = Array.isArray(images) && images.length > 0;
    const hasText = profileText && profileText.length >= 50;

    if (!hasText && !hasImages) {
      return NextResponse.json(
        { error: "Please provide either profile text or screenshots." },
        { status: 400 }
      );
    }

    // 2. Credit / premium check
    const userRef = doc(db, "users", session.user.email);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userData = userSnap.data();
    const isPremium: number = userData.isPremium || 0;
    const credits: number = userData.credits || 0;
    const auditsUsed: number = userData.auditsUsed || 0;

    let cost = 200;
    if (isPremium === 1 && auditsUsed < 1) cost = 0;
    if (isPremium === 2 && auditsUsed < 3) cost = 0;

    if (cost > 0 && credits < cost) {
      return NextResponse.json(
        { error: `Insufficient credits. Audit costs ${cost} credits.` },
        { status: 402 }
      );
    }

    // 3. AI Analysis — choose model based on whether images are present
    let analysisData: any;

    if (hasImages) {
      // Vision path — cap to 2 images, cap text to 3000 chars
      const parts: any[] = [
        { text: buildPrompt(hasText ? profileText.substring(0, 3000) : "[See attached screenshots]") },
      ];
      images.slice(0, 2).forEach((img: string) => {
        const base64 = img.split(",")[1];
        if (base64) {
          const mimeMatch = img.match(/data:(image\/[a-z]+);base64/);
          parts.push({
            inlineData: {
              data: base64,
              mimeType: mimeMatch ? mimeMatch[1] : "image/jpeg",
            },
          });
        }
      });
      const result = await visionModel.generateContent(parts);
      analysisData = JSON.parse(result.response.text());
    } else {
      // Text-only path — cheaper model, cap input at 4000 chars
      const prompt = buildPrompt(profileText.substring(0, 4000));
      const result = await textModel.generateContent(prompt);
      analysisData = JSON.parse(result.response.text());
    }

    // 4. Deduct credits / increment audit count
    const updates: any = { auditsUsed: increment(1) };
    if (cost > 0) updates.credits = increment(-cost);
    await updateDoc(userRef, updates);

    return NextResponse.json({ success: true, analysis: analysisData, creditsDeducted: cost });

  } catch (e: unknown) {
    console.error("LinkedIn Audit Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
