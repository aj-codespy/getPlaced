
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();

    // 1. Check for Master Profile
    const profileDocRef = doc(db, "profiles", email);
    const profileSnap = await getDoc(profileDocRef);

    if (!profileSnap.exists()) {
        return NextResponse.json({ error: "Profile not found. Please complete your profile first." }, { status: 400 });
    }

    const profileData = profileSnap.data();

    // 2. Check Credits (Placeholder)
    // TODO: Implement actual credit check against "users" collection
    const hasCredits = true; 
    if (!hasCredits) {
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
            experience: profileData.experience || [],
            projects: profileData.projects || [],
            skills: profileData.skills || [], // Ensure array vs string handling
            certifications: profileData.certifications || [],
            publications: profileData.publications || [],
            achievements: profileData.achievements || []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "resumes"), resumeData);

    // 4. Return the new Resume ID
    return NextResponse.json({ success: true, resumeId: docRef.id });

  } catch (e: unknown) {
    console.error("Create Resume Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
