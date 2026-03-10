import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase/config";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

type FireDoc = Record<string, unknown> & {
  createdAt?: { toMillis?: () => number; toDate?: () => Date };
};

function sortByCreatedAtDesc<T extends FireDoc>(rows: T[]): T[] {
  return rows.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const emailRaw = session.user.email;
    const emailLower = emailRaw.toLowerCase();
    const sessionId = (session.user as { id?: string }).id || "";

    // Resolve user doc robustly (credential users are lowercase doc IDs).
    const userCandidates = Array.from(new Set([emailLower, emailRaw]));
    let userData: Record<string, unknown> | null = null;
    for (const key of userCandidates) {
      const snap = await getDoc(doc(db, "users", key));
      if (snap.exists()) {
        userData = snap.data();
        break;
      }
    }

    if (!userData) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    // Profile is usually keyed by lowercase email.
    let profileData: Record<string, unknown> | null = null;
    const profileSnap = await getDoc(doc(db, "profiles", emailLower));
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
    } else {
      const profileKeys = Array.from(new Set([emailLower, emailRaw])).slice(0, 10);
      const profileQ = query(collection(db, "profiles"), where("email", "in", profileKeys));
      const profileQS = await getDocs(profileQ);
      if (!profileQS.empty) profileData = profileQS.docs[0].data();
    }

    const idsToCheck = Array.from(
      new Set(
        [
          emailRaw,
          emailLower,
          sessionId,
          typeof userData.email === "string" ? userData.email : "",
        ].filter(Boolean),
      ),
    ).slice(0, 10);

    let resumes: Array<Record<string, unknown>> = [];
    let downloads: Array<Record<string, unknown>> = [];

    if (idsToCheck.length > 0) {
      const resumeQ = query(collection(db, "resumes"), where("userId", "in", idsToCheck));
      const resumeSnap = await getDocs(resumeQ);
      resumes = sortByCreatedAtDesc(
        resumeSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })),
      );

      const downloadQ = query(collection(db, "download_history"), where("userId", "in", idsToCheck));
      const downloadSnap = await getDocs(downloadQ);
      downloads = sortByCreatedAtDesc(
        downloadSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })),
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        profile: profileData,
        resumes,
        downloads,
      },
    });
  } catch (e: unknown) {
    console.error("Dashboard Summary Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}
