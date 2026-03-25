"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Zap, TrendingUp, FileText, Mail, ShieldCheck } from "lucide-react";
import { evaluateEmailForAuth, getAuthErrorMessage } from "@/lib/email-policy";

const PERKS = [
  { icon: Zap, text: "AI resume in under 30 seconds" },
  { icon: TrendingUp, text: "94% ATS pass rate" },
  { icon: FileText, text: "12 premium templates" },
];

type SignupStep = "form" | "verify";

export default function SignupPage() {
  const router = useRouter();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", contact: "", inviteCode: "" });
  const [step, setStep] = useState<SignupStep>("form");
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  useEffect(() => {
    const authErrorCode = new URLSearchParams(window.location.search).get("error");
    if (authErrorCode) {
      setError(getAuthErrorMessage(authErrorCode));
    }

    const refCode = (new URLSearchParams(window.location.search).get("ref") || "").trim();
    if (refCode) {
      const normalized = refCode.toUpperCase();
      setForm((prev) => ({ ...prev, inviteCode: normalized }));
      localStorage.setItem("pendingReferralCode", normalized);
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleSendOTP = async () => {
    setError("");
    setSuccess("");

    // Validate email first
    const emailCheck = evaluateEmailForAuth(form.email);
    if (!emailCheck.ok) {
      setError(emailCheck.message);
      return;
    }

    if (!form.name || !form.password) {
      setError("Please fill in all required fields first.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setOtpSending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send verification code.");
        return;
      }
      setStep("verify");
      setSuccess("Verification code sent! Check your email.");
      setOtpCooldown(60); // 60 second cooldown
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Step 1: Verify OTP
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.message || "Invalid verification code.");
        setLoading(false);
        return;
      }

      // Step 2: Register
      const invite = form.inviteCode.trim().toUpperCase();
      if (invite) {
        localStorage.setItem("pendingReferralCode", invite);
      } else {
        localStorage.removeItem("pendingReferralCode");
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, inviteCode: invite }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed. Please try again.");
      } else {
        router.push("/login");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "form") {
      await handleSendOTP();
    } else {
      await handleVerifyAndRegister(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#030814] flex font-sans">

      {/* ── Left panel: branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-white">
            <div className="h-9 w-9 rounded-xl border border-white/15 bg-white/5 p-1.5 shadow-lg shadow-indigo-500/20">
              <Image src="/logo.png" alt="getPlaced" width={36} height={36} className="h-full w-full object-contain" />
            </div>
            getPlaced
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-3">
              Land your dream job
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                with AI on your side.
              </span>
            </h2>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Create a free account and generate your first tailored resume in under a minute.
            </p>
          </div>

          <div className="space-y-3">
            {PERKS.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <p.icon size={15} />
                </div>
                <span className="text-sm text-slate-300">{p.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial snippet */}
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
            <p className="text-sm text-slate-300 italic mb-3">
              &ldquo;Got 3 interview calls in a week. The AI rewrites are insanely good.&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">P</div>
              <div>
                <div className="text-xs font-semibold text-white">Priya S.</div>
                <div className="text-[10px] text-slate-500">SWE @ Google</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-700">© 2025 getPlaced</div>
      </div>

      {/* ── Right panel: form ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative overflow-y-auto">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <div className="h-8 w-8 rounded-lg border border-white/15 bg-white/5 p-1.5">
              <Image src="/logo.png" alt="getPlaced" width={32} height={32} className="h-full w-full object-contain" />
            </div>
            getPlaced
          </Link>
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2">
              {step === "form" ? "Create your account" : "Verify your email"}
            </h1>
            <p className="text-slate-400">
              {step === "form" 
                ? "Start building your perfect resume today — free." 
                : `Enter the 6-digit code sent to ${form.email}`
              }
            </p>
          </div>

          {step === "form" && (
            <>
              {/* Google OAuth */}
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium py-3 rounded-xl transition-all duration-200 mb-6"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs text-slate-600 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>
            </>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {step === "form" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Full Name</label>
                    <Input
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:border-indigo-500/60 focus-visible:ring-indigo-500/20 h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Contact</label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:border-indigo-500/60 focus-visible:ring-indigo-500/20 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:border-indigo-500/60 focus-visible:ring-indigo-500/20 h-11 rounded-xl"
                  />
                  <p className="text-[11px] text-slate-500">
                    Allowed: Gmail, major personal providers, and academic (.edu/.ac) emails. No temporary emails.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:border-indigo-500/60 focus-visible:ring-indigo-500/20 h-11 rounded-xl pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Referral Code (Optional)</label>
                  <Input
                    placeholder="E.g. AYUSH-AB12"
                    value={form.inviteCode}
                    onChange={(e) => setForm({ ...form, inviteCode: e.target.value.toUpperCase() })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:border-indigo-500/60 focus-visible:ring-indigo-500/20 h-11 rounded-xl"
                  />
                  <p className="text-[11px] text-slate-500">
                    Got a referral link? Your code is auto-filled. Both you and your friend earn 50 credits!
                  </p>
                </div>

                {/* Terms notice */}
                <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/8 rounded-xl p-3.5 text-xs text-slate-500">
                  <CheckCircle2 size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-indigo-400 hover:underline ml-1">Terms</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-indigo-400 hover:underline ml-1">Privacy Policy</Link>.
                </div>
              </>
            ) : (
              /* ── OTP Verification Step ─────────────────────────────────── */
              <>
                {/* Email display */}
                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Mail size={18} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{form.email}</p>
                    <p className="text-xs text-slate-500">Check your inbox for the 6-digit code</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Verification Code</label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:border-indigo-500/60 focus-visible:ring-indigo-500/20 h-12 rounded-xl text-center text-2xl font-mono tracking-[0.3em]"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => { setStep("form"); setOtp(""); setError(""); setSuccess(""); }}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    ← Change email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpCooldown > 0 || otpSending}
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors disabled:text-slate-600 disabled:cursor-not-allowed"
                  >
                    {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend code"}
                  </button>
                </div>
              </>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400 animate-in fade-in slide-in-from-top-1 duration-200">
                <ShieldCheck size={14} className="shrink-0" />
                {success}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otpSending}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold h-12 rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-500/30 transition-all duration-200 hover:shadow-indigo-500/40"
            >
              {loading || otpSending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : step === "form" ? (
                <>
                  Verify Email & Continue
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Create Account
                  <ShieldCheck size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
