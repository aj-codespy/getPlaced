import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRef = doc(db, "otp_verifications", normalizedEmail);
    const otpSnap = await getDoc(otpRef);

    if (!otpSnap.exists()) {
      return NextResponse.json(
        { message: "No verification code found. Please request a new one." },
        { status: 404 }
      );
    }

    const otpData = otpSnap.data();

    // Check if already verified
    if (otpData.verified) {
      return NextResponse.json({ success: true, message: "Email already verified." });
    }

    // Check max attempts
    if ((otpData.attempts || 0) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { message: "Too many attempts. Please request a new verification code." },
        { status: 429 }
      );
    }

    // Check expiry
    const expiresAt = new Date(otpData.expiresAt);
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { message: "Verification code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Increment attempts
    await updateDoc(otpRef, {
      attempts: (otpData.attempts || 0) + 1,
    });

    // Verify OTP
    if (otpData.otp !== otp.trim()) {
      const remaining = MAX_ATTEMPTS - (otpData.attempts || 0) - 1;
      return NextResponse.json(
        { message: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
        { status: 400 }
      );
    }

    // Mark as verified
    await updateDoc(otpRef, { verified: true });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { message: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
