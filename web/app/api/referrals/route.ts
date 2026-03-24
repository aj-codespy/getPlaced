import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nanoid } from "nanoid";
import { db } from "@/lib/firebase/config";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const REFERRAL_BONUS_CREDITS = 50;

async function resolveUserByEmail(emailRaw: string) {
  const emailLower = emailRaw.toLowerCase();
  const lowerRef = doc(db, "users", emailLower);
  const lowerSnap = await getDoc(lowerRef);
  if (lowerSnap.exists()) return { ref: lowerRef, snap: lowerSnap, emailLower };

  if (emailRaw !== emailLower) {
    const rawRef = doc(db, "users", emailRaw);
    const rawSnap = await getDoc(rawRef);
    if (rawSnap.exists()) return { ref: rawRef, snap: rawSnap, emailLower };
  }

  return null;
}

// GET: fetch referral code and stats
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRecord = await resolveUserByEmail(session.user.email);
  if (!userRecord) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userData = userRecord.snap.data();
  if (!userData.referralCode) {
    const code =
      (session.user.name?.split(" ")[0].toUpperCase() || "USER") + "-" + nanoid(4).toUpperCase();
    await updateDoc(userRecord.ref, { referralCode: code });
    userData.referralCode = code;
  }

  return NextResponse.json({
    code: userData.referralCode,
    referralCount: userData.referralCount || 0,
    creditsEarned: userData.referralCredits || 0,
    rewardPerReferral: REFERRAL_BONUS_CREDITS,
    totalCredits: userData.credits || 0,
    isPremium: userData.isPremium || 0,
    planType: userData.planType || "free",
  });
}

// POST: apply referral code for current user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    const normalizedCode = typeof code === "string" ? code.trim().toUpperCase() : "";
    if (!normalizedCode) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const currentUserRecord = await resolveUserByEmail(session.user.email);
    if (!currentUserRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUserRecord.snap.data()?.referredBy) {
      return NextResponse.json({ error: "Already referred" }, { status: 400 });
    }

    if ((currentUserRecord.snap.data()?.referralCode || "").toUpperCase() === normalizedCode) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    const usersRef = collection(db, "users");
    const codeQuery = query(usersRef, where("referralCode", "==", normalizedCode));
    const querySnapshot = await getDocs(codeQuery);
    if (querySnapshot.empty) {
      return NextResponse.json({ error: "Invalid Code" }, { status: 404 });
    }

    const referrerDoc = querySnapshot.docs[0];
    const referrerRef = referrerDoc.ref;
    const referrerEmail =
      (typeof referrerDoc.data().email === "string"
        ? referrerDoc.data().email.toLowerCase()
        : ""
      ).trim();

    if (!referrerEmail || referrerEmail === currentUserRecord.emailLower) {
      return NextResponse.json({ error: "Invalid Code" }, { status: 400 });
    }

    await runTransaction(db, async (tx) => {
      const freshCurrentSnap = await tx.get(currentUserRecord.ref);
      if (!freshCurrentSnap.exists()) throw new Error("User not found");
      if (freshCurrentSnap.data().referredBy) throw new Error("ALREADY_REFERRED");

      const freshReferrerSnap = await tx.get(referrerRef);
      if (!freshReferrerSnap.exists()) throw new Error("Invalid Code");

      tx.update(currentUserRecord.ref, {
        referredBy: referrerEmail,
        referredAt: serverTimestamp(),
        credits: increment(REFERRAL_BONUS_CREDITS),
      });

      tx.update(referrerRef, {
        referralCount: increment(1),
        credits: increment(REFERRAL_BONUS_CREDITS),
        referralCredits: increment(REFERRAL_BONUS_CREDITS),
      });
    });

    return NextResponse.json({
      success: true,
      rewardTriggered: true,
      creditsAwarded: { referrer: REFERRAL_BONUS_CREDITS, referredUser: REFERRAL_BONUS_CREDITS },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "ALREADY_REFERRED") {
      return NextResponse.json({ error: "Already referred" }, { status: 400 });
    }
    console.error("Referral Apply Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to apply referral" },
      { status: 500 },
    );
  }
}
