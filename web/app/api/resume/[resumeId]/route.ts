
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export async function GET(req: Request, { params }: { params: Promise<{ resumeId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resumeId } = await params;

    const resumeRef = doc(db, "resumes", resumeId);
    const resumeSnap = await getDoc(resumeRef);

    if (!resumeSnap.exists()) {
        return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const resumeData = resumeSnap.data();

    return NextResponse.json(resumeData.content); 

  } catch (e: unknown) {
    console.error("Fetch Resume Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
