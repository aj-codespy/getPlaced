
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { safeJsonParse } from "@/lib/safe-json";

type GenerativeModelLike = {
  generateContent: (
    prompt: string | Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>,
  ) => Promise<{
    response: {
      text: () => string;
    };
  }>;
};

function getModel(): GenerativeModelLike | null {
  const key = process.env.GEMINI_API_KEY || "";
  if (!key) return null;
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 4096,
    },
  });
}

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

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toScore(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.min(100, Math.round(value)));
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(100, Math.round(parsed)));
  }
  return fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}

function normalizeSection(
  raw: unknown,
  fallbackFeedback: string,
  opts: { withSuggestion?: boolean; withMissingKeywords?: boolean } = {},
) {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const base: Record<string, unknown> = {
    score: toScore(data.score, 60),
    feedback: toText(data.feedback) || fallbackFeedback,
  };

  if (opts.withSuggestion) {
    base.suggestion = toText(data.suggestion) || "Add more role-specific details and measurable impact.";
  }
  if (opts.withMissingKeywords) {
    base.missingKeywords = toStringArray(data.missingKeywords).slice(0, 15);
  }
  return base;
}

function normalizeAuditReport(raw: Record<string, unknown>) {
  const actionItems = toStringArray(raw.actionItems).slice(0, 5);
  return {
    overallScore: toScore(raw.overallScore, 60),
    headline: normalizeSection(raw.headline, "Headline quality could not be fully assessed.", { withSuggestion: true }),
    about: normalizeSection(raw.about, "About section quality could not be fully assessed.", { withSuggestion: true }),
    experience: normalizeSection(raw.experience, "Experience quality could not be fully assessed.", { withSuggestion: true }),
    skills: normalizeSection(raw.skills, "Skills relevance could not be fully assessed.", { withMissingKeywords: true }),
    actionItems:
      actionItems.length > 0
        ? actionItems
        : [
            "Clarify your target role in the headline.",
            "Add measurable impact to experience bullets.",
            "Include missing skills relevant to your target jobs.",
          ],
  };
}

async function parseOrRepairJson(model: GenerativeModelLike, raw: string): Promise<Record<string, unknown>> {
  try {
    return safeJsonParse(raw);
  } catch {
    const repaired = await model.generateContent(`Fix this malformed JSON so it becomes valid strict JSON.
Return ONLY JSON.

MALFORMED JSON:
"""
${raw.substring(0, 7000)}
"""`);
    return safeJsonParse(repaired.response.text());
  }
}

async function resolveUserRef(emailRaw: string) {
  const emailLower = emailRaw.toLowerCase();
  const primaryRef = doc(db, "users", emailLower);
  const primarySnap = await getDoc(primaryRef);
  if (primarySnap.exists()) return { ref: primaryRef, data: primarySnap.data() };

  if (emailRaw !== emailLower) {
    const fallbackRef = doc(db, "users", emailRaw);
    const fallbackSnap = await getDoc(fallbackRef);
    if (fallbackSnap.exists()) return { ref: fallbackRef, data: fallbackSnap.data() };
  }

  return null;
}

export async function POST(req: Request) {
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await req.json()) as Record<string, unknown>;
    const profileText = typeof payload.profileText === "string" ? payload.profileText.trim() : "";
    const imagesRaw = Array.isArray(payload.images) ? payload.images : [];
    const images = imagesRaw
      .filter((img): img is string => typeof img === "string" && img.startsWith("data:image/"))
      .slice(0, 2);
    const hasImages = images.length > 0;
    const hasText = profileText.length >= 50;

    if (!hasText && !hasImages) {
      return NextResponse.json(
        { error: "Please provide either profile text or screenshots." },
        { status: 400 }
      );
    }

    const model = getModel();
    if (!model) {
      return NextResponse.json(
        { error: "LinkedIn audit is temporarily unavailable (missing GEMINI_API_KEY)." },
        { status: 500 },
      );
    }

    // 2. Premium / Plan Check
    const userRecord = await resolveUserRef(session.user.email);
    if (!userRecord) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const userData = userRecord.data;
    const isPremium = Number(userData.isPremium || 0);
    const planType = String(userData.planType || "free").toLowerCase();
    
    const hasPremiumPlan = isPremium > 0 || ["standard", "premium", "pro"].includes(planType);

    if (!hasPremiumPlan) {
      return NextResponse.json(
        { error: "LinkedIn Audit is an exclusive feature for Standard and Pro members. Please upgrade your plan." },
        { status: 403 }
      );
    }

    // 3. AI Analysis — choose model based on whether images are present
    let analysisData: Record<string, unknown> | null = null;

    if (hasImages) {
      // Vision path — cap to 2 images, cap text to 3000 chars
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
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
      const result = await model.generateContent(parts);
      const raw = result.response.text();
      analysisData = await parseOrRepairJson(model, raw);
    } else {
      // Text-only path — cheaper model, cap input at 4000 chars
      const prompt = buildPrompt(profileText.substring(0, 4000));
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      analysisData = await parseOrRepairJson(model, raw);
    }

    // 4. Increment audit count
    const updates: Record<string, ReturnType<typeof increment> | number> = { auditsUsed: increment(1) };
    await updateDoc(userRecord.ref, updates);

    return NextResponse.json({
      success: true,
      analysis: normalizeAuditReport((analysisData || {}) as Record<string, unknown>),
      creditsDeducted: 0,
    });

  } catch (e: unknown) {
    console.error("LinkedIn Audit Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
