import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { evaluateEmailForAuth } from "@/lib/email-policy";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, contact, referralCode } = body;

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
    
    // Check referral (Simplified for Firebase)
    const referrerId = null;
    const initialCredits = 100; // 100 free credits at start

    await setDoc(userRef, {
      name,
      email: emailLower,
      password: hashedPassword,
      contact: contact || null,
      credits: initialCredits,
      referredBy: referrerId,
      referralCode: referralCode || Math.random().toString(36).substring(7),
      createdAt: serverTimestamp(),
      provider: "credentials"
    });

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
