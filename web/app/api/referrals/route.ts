
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, increment, collection, setDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { nanoid } from "nanoid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

// GET: Fetch Referral Code & Stats
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRef = doc(db, "users", session.user.email);
  let userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let userData = userSnap.data();

  // Lazy Gen: If no code, generate one
  if (!userData.referralCode) {
      const code = (session.user.name?.split(" ")[0].toUpperCase() || "USER") + "-" + nanoid(4).toUpperCase();
      await updateDoc(userRef, { referralCode: code });
      userData.referralCode = code;
  }

  return NextResponse.json({
      code: userData.referralCode,
      referralCount: userData.referralCount || 0,
      referralCredits: userData.referralCredits || 0,
      totalCredits: userData.credits || 0
  });
}

// POST: Redeem a Code (Logic for the "Referred" user)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await req.json();
    if(!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

    const currentUserRef = doc(db, "users", session.user.email);
    const currentUserSnap = await getDoc(currentUserRef);
    
    if(currentUserSnap.data()?.referredBy) {
        return NextResponse.json({ error: "Already referred" }, { status: 400 });
    }
    
    if(currentUserSnap.data()?.referralCode === code) {
         return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Find Owner of Code
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("referralCode", "==", code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return NextResponse.json({ error: "Invalid Code" }, { status: 404 });
    }

    const referrerDoc = querySnapshot.docs[0];
    const referrerRef = referrerDoc.ref;
    const referrerData = referrerDoc.data();

    // Transactional Logic
    // 1. Mark Current User as Referred
    await updateDoc(currentUserRef, {
        referredBy: referrerData.email,
        referredAt: serverTimestamp()
    });

    // 2. Increment Referrer Count
    await updateDoc(referrerRef, {
        referralCount: increment(1)
    });

    // 3. Check for Reward Condition (Every 2 referrals)
    const newCount = (referrerData.referralCount || 0) + 1;
    let rewardTriggered = false;

    if (newCount % 2 === 0) {
        // Reward 100 Credits (1 Resume)
        await updateDoc(referrerRef, {
            credits: increment(100),
            referralCredits: increment(100)
        });
        rewardTriggered = true;
    }

    return NextResponse.json({ success: true, rewardTriggered });
}
