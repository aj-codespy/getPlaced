import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase/config"; // Import Firebase
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";


export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Try to get profile from Firestore
        // We'll assume the profile document ID matches the user's email for simplicity
        // OR we query by email field if we store it
        const profilesRef = collection(db, "profiles");
        const q = query(profilesRef, where("email", "==", session.user.email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Found existing profile
            return NextResponse.json({ profile: snapshot.docs[0].data() });
        }
        
        return NextResponse.json({ profile: null });
    } catch (e: unknown) {
        console.error("Firebase Profile GET Error:", e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();

        // Save to Firestore
        // Use email as the document ID for 'profiles' collection to ensure uniqueness per user
        const cleanEmail = session.user.email.toLowerCase();
        
        const profileData = {
           email: cleanEmail,
           isLocked: data.isLocked || false,
           personalInfo: data.personalInfo,
           experience: data.experience,
           education: data.education,
           skills: data.skills,
           projects: data.projects,
           achievements: data.achievements || [],
           certifications: data.certifications || [],
           publications: data.publications || [],
           courses: data.courses || [],
           updatedAt: new Date().toISOString()
        };

        // setDoc with merge: true acts like Upsert
        await setDoc(doc(db, "profiles", cleanEmail), profileData, { merge: true });

        return NextResponse.json({ success: true, profile: profileData });

    } catch (e: unknown) {
        console.error("Firebase Profile POST Error:", e);
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}
