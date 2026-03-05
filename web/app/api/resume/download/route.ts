
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import crypto from "crypto";
import { RESUME_TEMPLATES } from "@/lib/templates";

const PYTHON_SERVICE_URL =
  (process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/$/, "") + "/generate-pdf";

export async function POST(req: Request) {
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resumeId, resumeData, templateId } = await req.json();
    const userEmail = session.user.email;
    const userRef = doc(db, "users", userEmail);

    // 2. Auth checks
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User record not found" }, { status: 403 });
    }
    const userData = userSnap.data();

    // 3. Resolve resume data
    let dataToRender: Record<string, unknown>;
    let templateToRender = templateId || "classic";
    let filename = "resume";

    if (resumeData) {
      // Builder passes data directly — most common path
      dataToRender = resumeData;
    } else if (resumeId) {
      const docRef = doc(db, "resumes", resumeId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return NextResponse.json({ error: "Resume not found" }, { status: 404 });
      }
      const resume = docSnap.data();
      dataToRender = resume.content;
      templateToRender = templateId || resume.templateId || "classic";
      filename = (resume.targetRole || "resume").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    } else {
      return NextResponse.json(
        { error: "Resume ID or data required" },
        { status: 400 }
      );
    }

    // 4. Generate payload hash for caching
    const payloadString = JSON.stringify({ data: dataToRender, template: templateToRender });
    const payloadHash = crypto.createHash("sha256").update(payloadString).digest("hex");

    // Check Cache First (Huge Savings)
    const cacheRef = doc(db, "pdf_cache", payloadHash);
    const cacheSnap = await getDoc(cacheRef);

    if (cacheSnap.exists() && cacheSnap.data().pdfBase64) {
      // Cache hit
      const base64Data = cacheSnap.data().pdfBase64;
      const buffer = Buffer.from(base64Data, "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
          "Content-Length": String(buffer.byteLength),
        },
      });
    }

    // 5. Rate Limit Verification (For un-cached recompilations only)
    const isPremium = (userData.isPremium || 0) > 0 || userData.planType === 'premium' || userData.planType === 'pro' || userData.planType === 'standard';
    
    // Validate Premium Template Access First
    const templateConfig = RESUME_TEMPLATES.find(t => t.id === templateToRender);
    if (templateConfig?.type === 'premium' && !isPremium) {
        return NextResponse.json(
            { error: "Access Denied: You must upgrade to Pro to use Premium templates." },
            { status: 403 }
        );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let dailyPdfGenerations = userData.dailyPdfGenerations || 0;
    const lastPdfGenerationDate = userData.lastPdfGenerationDate || '';

    if (lastPdfGenerationDate !== todayStr) {
        dailyPdfGenerations = 0; // Reset for a new day
    }

    if (!isPremium && dailyPdfGenerations >= 3) {
        return NextResponse.json(
            { error: "Daily PDF generation limit reached (3/day) for Free plan. Please upgrade to Premium or wait until tomorrow." },
            { status: 429 }
        );
    }

    // 6. Call Python PDF service with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000); // 45s timeout

    let pdfRes: Response;
    try {
      pdfRes = await fetch(PYTHON_SERVICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: dataToRender,
          template_id: templateToRender,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
        return NextResponse.json(
          { error: "PDF generation timed out. Please try again." },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: "PDF service unavailable. Please ensure the Python service is running." },
        { status: 503 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!pdfRes.ok) {
      const errText = await pdfRes.text().catch(() => "Unknown error");
      console.error("Python service error:", errText);
      return NextResponse.json(
        { error: `PDF generation failed: ${errText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    // 7. Stream PDF back to client
    const pdfBuffer = await pdfRes.arrayBuffer();

    // 8. Cache the generated PDF and Update User Limits asynchronously
    (async () => {
        try {
            // Update user daily limits
            await updateDoc(userRef, {
                dailyPdfGenerations: dailyPdfGenerations + 1,
                lastPdfGenerationDate: todayStr
            });

            // Cache the PDF if it's within Firestore size limits (< 900KB to be safe)
            const base64Pdf = Buffer.from(pdfBuffer).toString("base64");
            if (base64Pdf.length < 900000) {
                await setDoc(cacheRef, {
                    pdfBase64: base64Pdf,
                    createdAt: serverTimestamp(),
                    templateId: templateToRender
                });
            }
        } catch (postGenErr) {
            console.error("Failed to update cache or limits:", postGenErr);
        }
    })();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });

  } catch (e: unknown) {
    console.error("PDF Download Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
