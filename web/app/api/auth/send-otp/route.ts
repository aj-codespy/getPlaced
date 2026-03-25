import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { evaluateEmailForAuth } from "@/lib/email-policy";
import crypto from "crypto";

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const emailCheck = evaluateEmailForAuth(email);
    if (!emailCheck.ok) {
      return NextResponse.json(
        { message: emailCheck.message, code: emailCheck.code },
        { status: 400 }
      );
    }

    const normalizedEmail = emailCheck.normalizedEmail;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in Firestore
    try {
      await setDoc(doc(db, "otp_verifications", normalizedEmail), {
        otp,
        email: normalizedEmail,
        expiresAt: expiresAt.toISOString(),
        verified: false,
        attempts: 0,
        createdAt: serverTimestamp(),
      });
    } catch (fsError) {
      console.error("Firestore OTP write error:", fsError);
      return NextResponse.json(
        { message: "Could not initiate verification. Please try again." },
        { status: 500 }
      );
    }

    // Send OTP email
    const sent = await sendOTPEmail(normalizedEmail, otp);

    if (!sent) {
      return NextResponse.json(
        { message: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { message: "Failed to send verification code." },
      { status: 500 }
    );
  }
}

const OTP_EMAIL_HTML = (otp: string) => `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #030814; color: #e2e8f0;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 0;">getPlaced</h1>
    <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Email Verification</p>
  </div>
  <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; text-align: center;">
    <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 20px;">Your verification code is:</p>
    <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', monospace; background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15)); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
      ${otp}
    </div>
    <p style="color: #64748b; font-size: 12px; margin: 0;">This code expires in <strong style="color: #94a3b8;">10 minutes</strong>.</p>
  </div>
  <p style="color: #475569; font-size: 11px; text-align: center; margin-top: 24px;">
    If you didn't request this code, you can safely ignore this email.
  </p>
</div>
`;

async function sendOTPEmail(to: string, otp: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  // ── Dev fallback: no API key → log OTP to console ───────────────────
  if (!resendApiKey) {
    console.warn("⚠️  RESEND_API_KEY not set — OTP logged to console only.");
    console.log(`\n🔑 [DEV OTP] Email: ${to}  |  Code: ${otp}\n`);
    return true;
  }

  // ── Production: send via Resend API (no npm package needed) ─────────
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "getPlaced <onboarding@resend.dev>",
        to: [to],
        subject: "Your getPlaced Verification Code",
        html: OTP_EMAIL_HTML(otp),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Resend] Email send failed:", res.status, err);
      return false;
    }

    console.log(`[OTP Email] ✅ Sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}
