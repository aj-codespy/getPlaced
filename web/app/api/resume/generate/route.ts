import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { filterResumeDataForTemplate, getTemplateSections } from "@/lib/templates";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { RESUME_TEMPLATES } from "@/lib/templates";

export async function POST(req: Request) {
  try {
    const { profile, targetJob, templateId, userId } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Profile data missing" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email.toLowerCase();
    const userRef = doc(db, "users", userEmail);
    const userSnap = await getDoc(userRef);

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
    const targetRole = targetJob || personalInfo?.headline || "General Professional";

    // Send the FULL profile to the optimizer so it has complete candidate context
    // for anti-hallucination. The optimizer only rewrites writable sections (summary,
    // experience, projects, skills) but needs the full profile for context.
    const pythonApiUrl = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${pythonApiUrl}/optimize-resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: profile,
        target_role: targetRole,
        template_sections: templateSections,
      }),
    });

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
      },
      education:        education        || [],
      achievements:     achievements     || [],
      certifications:   certifications   || [],
      publications:     publications     || [],
      experience:       aiOutput.experience || [],
      projects:         aiOutput.projects   || [],
      skills:           (Array.isArray(aiOutput.skills) && aiOutput.skills.length > 0)
                          ? aiOutput.skills
                          : (Array.isArray(profile.skills) ? profile.skills : []),
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
        userId:     userId || "anonymous",
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
