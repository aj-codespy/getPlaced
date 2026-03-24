import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, doc, getDoc, getDocs, increment, query, runTransaction, serverTimestamp, setDoc, where } from "firebase/firestore";
import type { DocumentReference } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { evaluateEmailForAuth } from "@/lib/email-policy";
import { nanoid } from "nanoid";

const REFERRAL_BONUS_CREDITS = 50;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, contact, inviteCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailCheck = evaluateEmailForAuth(email);
    if (!emailCheck.ok) {
      return NextResponse.json({ message: emailCheck.message, code: emailCheck.code }, { status: 400 });
    }

    const emailLower = emailCheck.normalizedEmail;
    const userRef = doc(db, "users", emailLower);
    const existingUser = await getDoc(userRef);

    if (existingUser.exists()) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const initialCredits = 100; // 100 free credits at start
    const ownReferralCode =
      (name?.toString().trim().split(" ")[0]?.toUpperCase() || "USER") +
      "-" +
      nanoid(4).toUpperCase();
    const normalizedInviteCode =
      typeof inviteCode === "string" ? inviteCode.trim().toUpperCase() : "";
    const baseUserData = {
      name,
      email: emailLower,
      password: hashedPassword,
      contact: contact || null,
      credits: initialCredits,
      referralCode: ownReferralCode,
      createdAt: serverTimestamp(),
      provider: "credentials",
    };

    // Validate referrer code if provided
    let referrerRef: DocumentReference | null = null;
    let referrerEmail = "";

    if (normalizedInviteCode) {
      const usersRef = collection(db, "users");
      const refQuery = query(usersRef, where("referralCode", "==", normalizedInviteCode));
      const refSnap = await getDocs(refQuery);
      if (refSnap.empty) {
        return NextResponse.json({ message: "Invalid referral code" }, { status: 400 });
      }

      const refDoc = refSnap.docs[0];
      const refData = refDoc.data();
      referrerEmail = (typeof refData.email === "string" ? refData.email.toLowerCase() : "").trim();

      if (!referrerEmail || referrerEmail === emailLower) {
        return NextResponse.json({ message: "Invalid referral code" }, { status: 400 });
      }

      referrerRef = refDoc.ref;
    }

    if (!referrerRef) {
      await setDoc(userRef, {
        ...baseUserData,
        referredBy: null,
      });
    } else {
      await runTransaction(db, async (tx) => {
        const referrerSnap = await tx.get(referrerRef!);
        if (!referrerSnap.exists()) {
          throw new Error("Referrer not found");
        }

        tx.set(userRef, {
          ...baseUserData,
          referredBy: referrerEmail,
          referredAt: serverTimestamp(),
          credits: initialCredits + REFERRAL_BONUS_CREDITS,
        });

        tx.update(referrerRef!, {
          referralCount: increment(1),
          credits: increment(REFERRAL_BONUS_CREDITS),
          referralCredits: increment(REFERRAL_BONUS_CREDITS),
        });
      });
    }

    return NextResponse.json(
      { message: "User created successfully", user: { id: emailLower, email: emailLower } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
