
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from "firebase/firestore";

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
      const v = obj[bucket];
      if (Array.isArray(v)) merged.push(...v.filter((s): s is string => typeof s === "string"));
      else if (typeof v === "string") merged.push(...v.split(",").map((s) => s.trim()).filter(Boolean));
    }
    return Array.from(new Set(merged.map((s) => s.trim()).filter(Boolean)));
  }
  return [];
}

function normalizeExperienceShape(rawExp: unknown): unknown[] {
  if (!Array.isArray(rawExp)) return [];
  return rawExp.map((item) => {
    if (!item || typeof item !== "object") return item;
    const exp = item as Record<string, unknown>;
    return {
      ...exp,
      role:
        (typeof exp.role === "string" && exp.role.trim()) ||
        (typeof exp.jobTitle === "string" && exp.jobTitle.trim()) ||
        (typeof exp.position === "string" && exp.position.trim()) ||
        (typeof exp.title === "string" && exp.title.trim()) ||
        "",
    };
  });
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const emailRaw = session.user.email;
    const email = emailRaw.toLowerCase();

    // 1. Check for Master Profile
    const profileDocRef = doc(db, "profiles", email);
    const profileSnap = await getDoc(profileDocRef);

    if (!profileSnap.exists()) {
        return NextResponse.json({ error: "Profile not found. Please complete your profile first." }, { status: 400 });
    }

    const profileData = profileSnap.data();

    // 2. Check Credits
    let userRef = doc(db, "users", email);
    let userSnap = await getDoc(userRef);
    if (!userSnap.exists() && emailRaw !== email) {
      userRef = doc(db, "users", emailRaw);
      userSnap = await getDoc(userRef);
    }

    if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userData = userSnap.data();
    const currentCredits = userData.credits || 0;

    if (currentCredits < 50) { // Costs 50 credits to create/init a new resume
        return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
    }

    // 3. Deep Copy Profile into New Resume
    // We basically initialize the resume with the master profile data
    const resumeData = {
        userId: email, // Using email as user identifier
        title: `Resume - ${new Date().toLocaleDateString()}`,
        targetRole: profileData.personalInfo?.headline || "General",
        templateId: "classic", // Default template
        content: {
            personalInfo: profileData.personalInfo || {},
            education: profileData.education || [],
            experience: normalizeExperienceShape(profileData.experience),
            projects: profileData.projects || [],
            skills: normalizeSkills(profileData.skills),
            certifications: profileData.certifications || [],
            publications: profileData.publications || [],
            achievements: profileData.achievements || []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "resumes"), resumeData);

    // Deduct 50 credits for new resume initialization
    await updateDoc(userRef, {
      credits: increment(-50)
    });

    // 4. Return the new Resume ID
    return NextResponse.json({ success: true, resumeId: docRef.id });

  } catch (e: unknown) {
    console.error("Create Resume Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
