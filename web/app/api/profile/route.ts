import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/firebase/config"; // Import Firebase
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";


export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const emailRaw = session.user.email;
        const emailLower = emailRaw.toLowerCase();

        // Primary profile key is lowercase email.
        const lowerProfile = await getDoc(doc(db, "profiles", emailLower));
        if (lowerProfile.exists()) {
            return NextResponse.json({ profile: lowerProfile.data() });
        }

        // Backward compatibility for legacy IDs or mixed-case email values.
        if (emailRaw !== emailLower) {
            const rawProfile = await getDoc(doc(db, "profiles", emailRaw));
            if (rawProfile.exists()) {
                return NextResponse.json({ profile: rawProfile.data() });
            }
        }

        const profilesRef = collection(db, "profiles");
        const keysToCheck = Array.from(new Set([emailLower, emailRaw])).slice(0, 10);
        const q = query(profilesRef, where("email", "in", keysToCheck));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
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
