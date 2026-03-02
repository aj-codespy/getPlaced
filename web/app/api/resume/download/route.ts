
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

const PYTHON_SERVICE_URL =
  process.env.PDF_SERVICE_URL || "http://127.0.0.1:8000/generate-pdf";

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

    // 2. Credit check
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User record not found" }, { status: 403 });
    }

    const userData = userSnap.data();
    const currentCredits: number = userData.credits ?? 0;

    if (currentCredits < 100) {
      return NextResponse.json(
        { error: "Insufficient credits. You need 100 credits to download." },
        { status: 402 }
      );
    }

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

    // 4. Call Python PDF service with a timeout
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

    // 5. Deduct credits ONLY after successful PDF generation
    await updateDoc(userRef, { credits: increment(-100) });

    // 6. Stream PDF back to client
    const pdfBuffer = await pdfRes.arrayBuffer();

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
