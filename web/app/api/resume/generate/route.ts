import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { filterResumeDataForTemplate, getTemplateSections } from "@/lib/templates";

export async function POST(req: Request) {
  try {
    const { profile, targetJob, templateId, userId } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Profile data missing" }, { status: 400 });
    }

    const resolvedTemplateId = templateId || "classic";
    const templateSections = getTemplateSections(resolvedTemplateId);

    const { personalInfo, education, achievements, certifications, publications, ...writableProfile } = profile;
    const targetRole = targetJob || personalInfo?.headline || "General Professional";

    const pythonApiUrl = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${pythonApiUrl}/optimize-resume`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: writableProfile,
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
      });
      resumeId = docRef.id;
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
