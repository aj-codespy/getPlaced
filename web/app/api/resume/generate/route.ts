import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { filterResumeDataForTemplate, getTemplateSections } from "@/lib/templates";
import { selectDisplayLinks } from "@/lib/profile-links";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { RESUME_TEMPLATES } from "@/lib/templates";

// Allow this serverless function up to 60s on Vercel (Pro plan).
// The Python optimizer runs 4 parallel Gemini calls and may need 15-30s.
export const maxDuration = 60;

function normalizeSkills(skillsRaw: unknown): string[] {
  if (Array.isArray(skillsRaw)) {
    return skillsRaw.filter((s): s is string => typeof s === "string" && s.trim().length > 0).map((s) => s.trim());
  }
  if (typeof skillsRaw === "string") {
    return skillsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (skillsRaw && typeof skillsRaw === "object") {
    const obj = skillsRaw as Record<string, unknown>;
    const merged: string[] = [];
    for (const bucket of ["technical", "tools", "soft"]) {
      const val = obj[bucket];
      if (Array.isArray(val)) {
        merged.push(...val.filter((s): s is string => typeof s === "string"));
      } else if (typeof val === "string") {
        merged.push(...val.split(",").map((s) => s.trim()).filter(Boolean));
      }
    }
    return Array.from(new Set(merged.map((s) => s.trim()).filter(Boolean)));
  }
  return [];
}

function normalizeExperienceShape(experienceRaw: unknown): unknown[] {
  if (!Array.isArray(experienceRaw)) return [];
  return experienceRaw.map((exp) => {
    if (!exp || typeof exp !== "object") return exp;
    const e = exp as Record<string, unknown>;
    return {
      ...e,
      role:
        (typeof e.role === "string" && e.role.trim()) ||
        (typeof e.jobTitle === "string" && e.jobTitle.trim()) ||
        (typeof e.position === "string" && e.position.trim()) ||
        (typeof e.title === "string" && e.title.trim()) ||
        "",
    };
  });
}

function isProfileComplete(profile: Record<string, unknown>): boolean {
  const personalInfo = (profile.personalInfo || {}) as Record<string, unknown>;
  const hasCorePersonalInfo =
    typeof personalInfo.fullName === "string" &&
    personalInfo.fullName.trim().length > 0 &&
    typeof personalInfo.email === "string" &&
    personalInfo.email.trim().length > 0 &&
    typeof personalInfo.location === "string" &&
    personalInfo.location.trim().length > 0;

  const hasSomeResumeData =
    (Array.isArray(profile.experience) && profile.experience.length > 0) ||
    (Array.isArray(profile.projects) && profile.projects.length > 0) ||
    (Array.isArray(profile.education) && profile.education.length > 0) ||
    normalizeSkills(profile.skills).length > 0;

  return hasCorePersonalInfo && hasSomeResumeData;
}

export async function POST(req: Request) {
  try {
    const { profile, targetJob, templateId, userId } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Profile data missing" }, { status: 400 });
    }
    if (!isProfileComplete(profile as Record<string, unknown>)) {
      return NextResponse.json(
        { error: "Complete your profile first before generating resumes." },
        { status: 400 },
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmailRaw = session.user.email;
    const userEmail = userEmailRaw.toLowerCase();
    let userRef = doc(db, "users", userEmail);
    let userSnap = await getDoc(userRef);
    if (!userSnap.exists() && userEmailRaw !== userEmail) {
      userRef = doc(db, "users", userEmailRaw);
      userSnap = await getDoc(userRef);
    }

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 403 });
    }

    const userData = userSnap.data();
    const currentCredits: number = userData.credits || 0;

    if (currentCredits < 100) {
      return NextResponse.json({ error: "Insufficient credits for AI generation. Please recharge." }, { status: 402 });
    }

    const resolvedTemplateId = templateId || "classic";

    const isPremium = (userData.isPremium || 0) > 0 || userData.planType === 'premium' || userData.planType === 'pro' || userData.planType === 'standard';
    const templateConfig = RESUME_TEMPLATES.find(t => t.id === resolvedTemplateId);
    if (templateConfig?.type === 'premium' && !isPremium) {
        return NextResponse.json(
            { error: "Access Denied: You must upgrade to Pro to generate Premium templates." },
            { status: 403 }
        );
    }

    const templateSections = getTemplateSections(resolvedTemplateId);

    const { personalInfo, education, achievements, certifications, publications } = profile;
    const normalizedSkills = normalizeSkills(profile.skills);
    const normalizedExperience = normalizeExperienceShape(profile.experience);
    const targetRole = targetJob || personalInfo?.headline || "General Professional";

    // Send the FULL profile to the optimizer so it has complete candidate context
    // for anti-hallucination. The optimizer only rewrites writable sections (summary,
    // experience, projects, skills) but needs the full profile for context.
    const pythonApiUrl = (process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

    // Add timeout to prevent hanging if the Python service is slow or cold-starting
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55_000); // 55s timeout

    let res: Response;
    try {
      res = await fetch(`${pythonApiUrl}/optimize-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // normalize mixed profile shapes before sending to Python optimizer
          profile: {
            ...profile,
            skills: normalizedSkills,
            experience: normalizedExperience,
          },
          target_role: targetRole,
          template_sections: templateSections,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
        return NextResponse.json(
          { success: false, error: "Resume optimization timed out. The AI service may be warming up — please try again in a moment." },
          { status: 504 }
        );
      }
      console.error("Python service connection error:", fetchErr);
      return NextResponse.json(
        { success: false, error: "AI optimization service is currently unavailable. Please try again in a few seconds." },
        { status: 503 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Python optimizer failed:", errText);
      throw new Error("Failed to optimize resume via Python service.");
    }

    const resJson = await res.json();
    if (!resJson.success) {
      throw new Error(resJson.error || "Failed to optimize resume");
    }

    const aiOutput = resJson.data;
    const inputTokens = aiOutput.input_tokens || 0;
    const outputTokens = aiOutput.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;


    // ── Re-assemble full resume — inject static sections back ───────────────
    const fullContent = {
      personalInfo: {
        ...personalInfo,
        summary: aiOutput.summary || "",
        displayLinks: selectDisplayLinks(personalInfo, targetRole, 4),
      },
      education:        education        || [],
      achievements:     achievements     || [],
      certifications:   certifications   || [],
      publications:     publications     || [],
      experience:       aiOutput.experience || [],
      projects:         aiOutput.projects   || [],
      skills:           (Array.isArray(aiOutput.skills) && aiOutput.skills.length > 0)
                          ? aiOutput.skills
                          : normalizedSkills,
    };

    // ── Filter to only sections the template renders ────────────────────────
    const optimizedContent = filterResumeDataForTemplate(fullContent, resolvedTemplateId);

    // ── Save to Firestore ───────────────────────────────────────────────────
    let resumeId: string | null = null;
    try {
      const sanitize = (obj: unknown): unknown => {
        if (Array.isArray(obj)) return obj.map(sanitize);
        if (obj && typeof obj === "object") {
          const out: Record<string, unknown> = {};
          for (const k in obj as Record<string, unknown>) {
            const val = (obj as Record<string, unknown>)[k];
            out[k] = val === undefined ? null : sanitize(val);
          }
          return out;
        }
        return obj === undefined ? null : obj;
      };

      const docRef = await addDoc(collection(db, "resumes"), {
        userId:     userId || (session.user as { id?: string }).id || userEmail,
        targetRole: targetJob || "General",
        content:    sanitize(optimizedContent),
        templateId: resolvedTemplateId,
        createdAt:  serverTimestamp(),
        tokens: {
            input: inputTokens,
            output: outputTokens,
            total: totalTokens
        }
      });
      resumeId = docRef.id;

      // Deduct credits after a successful generation
      await updateDoc(userRef, {
        credits: increment(-100)
      });
    } catch (dbError) {
      console.error("Firebase Save Failed (continuing):", dbError);
    }

    return NextResponse.json({ success: true, data: optimizedContent, resumeId });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Generation error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
