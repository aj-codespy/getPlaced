"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  MousePointer2,
  CheckCircle2,
  FileText,
  Star,
  ChevronRight,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

const FEATURES = [
  {
    icon: Zap,
    color: "text-amber-400",
    bg: "from-amber-500/10",
    border: "border-amber-500/20",
    title: "Instant AI Generation",
    desc: "Paste a job description. Get a tailored, ATS-optimized resume in under 30 seconds.",
  },
  {
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "from-emerald-500/10",
    border: "border-emerald-500/20",
    title: "ATS Score Boost",
    desc: "Our AI rewrites your bullets with action verbs and quantified results that pass ATS filters.",
  },
  {
    icon: FileText,
    color: "text-blue-400",
    bg: "from-blue-500/10",
    border: "border-blue-500/20",
    title: "12 Premium Templates",
    desc: "From minimal to Ivy League — pick a design that matches your industry and personality.",
  },
  {
    icon: Shield,
    color: "text-violet-400",
    bg: "from-violet-500/10",
    border: "border-violet-500/20",
    title: "LinkedIn Audit",
    desc: "AI-powered analysis of your LinkedIn profile with actionable improvement suggestions.",
  },
];

const STEPS = [
  { n: "01", title: "Complete your profile", desc: "Enter your experience, education, and skills once." },
  { n: "02", title: "Paste the job description", desc: "Drop in any JD — our AI reads it and tailors your resume to it." },
  { n: "03", title: "Download your PDF", desc: "Pick a template and download a polished, recruiter-ready resume." },
];

const TESTIMONIALS = [
  { name: "Priya S.", role: "SWE @ Google", text: "Got 3 interview calls in a week after using getPlaced. The AI rewrites are insanely good.", stars: 5 },
  { name: "Arjun M.", role: "PM @ Razorpay", text: "Went from 0 callbacks to 5 in 2 weeks. The ATS optimization is real.", stars: 5 },
  { name: "Sneha R.", role: "Designer @ Swiggy", text: "The templates are beautiful and the AI actually understands design roles.", stars: 5 },
];

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans overflow-x-hidden selection:bg-indigo-500/30">

      {/* ── Ambient background ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[15%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[130px] animate-float" />
        <div className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] animate-float delay-2000" />
        <div className="absolute bottom-[-10%] left-[5%] w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[100px] animate-float delay-3000" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
          <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={16} fill="white" className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            getPlaced
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-white transition-colors duration-200">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Log in
          </Link>
          <Link href="/signup">
            <button className="group relative flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-500/50 transition-all duration-200 hover:shadow-indigo-500/40 hover:shadow-xl">
              Get started free
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="text-center max-w-5xl mx-auto px-4 pt-16 pb-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-indigo-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            Powered by Google Gemini AI
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-[80px] font-extrabold tracking-tight leading-[1.05] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            <span className="bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
              Your dream job
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              starts with a great CV
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            AI-powered resume builder that reads the job description and rewrites your resume to match it — perfectly. ATS-optimized, recruiter-approved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/signup">
              <button className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-500/30 border border-indigo-500/30 transition-all duration-300 hover:shadow-indigo-500/50 hover:scale-[1.02] text-base">
                <Sparkles size={18} />
                Build my resume &mdash; it&apos;s free
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                View pricing <ChevronRight size={14} />
              </button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 mt-8 text-sm text-slate-500 animate-in fade-in duration-700 delay-500">
            <div className="flex -space-x-2">
              {["bg-indigo-400", "bg-violet-400", "bg-blue-400", "bg-emerald-400", "bg-pink-400"].map((c, i) => (
                <div key={i} className={`h-7 w-7 rounded-full ${c} border-2 border-[#030712]`} />
              ))}
            </div>
            <span>Trusted by <strong className="text-slate-300">50,000+</strong> job seekers</span>
          </div>
        </section>

        {/* ── Hero visual: floating resume mockup ────────────────────────────── */}
        <section className="relative max-w-5xl mx-auto px-4 py-8 flex justify-center">
          {/* Floating AI chips */}
          <div className="absolute top-8 left-[5%] md:left-[8%] z-20 animate-float delay-1000 hidden md:flex items-center gap-2 bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl">
            <Sparkles size={12} className="text-indigo-400" />
            <span className="text-xs text-slate-300">Try: <span className="text-indigo-300">&ldquo;Led a team of 8 engineers&rdquo;</span></span>
          </div>

          <div className="absolute top-16 right-[5%] md:right-[8%] z-20 animate-float delay-2000 hidden md:flex items-center gap-2 bg-[#0f172a]/90 backdrop-blur-xl border border-emerald-500/20 px-4 py-2.5 rounded-2xl shadow-2xl">
            <TrendingUp size={12} className="text-emerald-400" />
            <span className="text-xs text-slate-300">ATS Score: <strong className="text-emerald-400">94%</strong></span>
          </div>

          <div className="absolute bottom-[30%] right-[3%] md:right-[6%] z-20 animate-float delay-3000 hidden md:flex items-center gap-2 bg-[#0f172a]/90 backdrop-blur-xl border border-violet-500/20 px-4 py-2.5 rounded-2xl shadow-2xl">
            <MousePointer2 size={12} className="text-violet-400" />
            <span className="text-xs text-slate-300">Improved: <span className="text-violet-300">+24% conversion</span></span>
          </div>

          {/* Resume card */}
          <div
            className="relative w-full max-w-[580px] bg-white rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden"
            style={{ transform: "rotateX(20deg) scale(0.92)", transformOrigin: "center top", perspective: "2000px" }}
          >
            {/* Resume header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 pb-5">
              <div className="h-5 w-40 bg-white/90 rounded mb-2" />
              <div className="h-3 w-28 bg-white/40 rounded mb-4" />
              <div className="flex gap-3">
                {["bg-white/20", "bg-white/20", "bg-white/20"].map((c, i) => (
                  <div key={i} className={`h-2 w-20 ${c} rounded`} />
                ))}
              </div>
            </div>

            {/* Resume body */}
            <div className="p-6 grid grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="h-3 w-16 bg-slate-800 rounded" />
                {[1, 0.7, 0.9, 0.6].map((w, i) => (
                  <div key={i} className="h-2 bg-slate-100 rounded" style={{ width: `${w * 100}%` }} />
                ))}
                <div className="h-3 w-16 bg-slate-800 rounded mt-4" />
                {["bg-indigo-100", "bg-indigo-100", "bg-violet-100"].map((c, i) => (
                  <div key={i} className={`h-2 ${c} rounded w-full`} />
                ))}
              </div>
              <div className="col-span-2 space-y-4">
                <div className="h-3 w-28 bg-slate-800 rounded" />
                <div className="space-y-2">
                  {[1, 0.9, 0.85, 0.7].map((w, i) => (
                    <div key={i} className="h-2 bg-slate-100 rounded" style={{ width: `${w * 100}%` }} />
                  ))}
                </div>
                {/* Highlighted line */}
                <div className="bg-indigo-50 border-l-2 border-indigo-400 pl-3 py-1.5 rounded-r">
                  <div className="h-2 bg-indigo-200 rounded w-full mb-1" />
                  <div className="h-2 bg-indigo-200 rounded w-4/5" />
                </div>
                <div className="space-y-2 pt-2">
                  {[0.95, 0.8, 0.9].map((w, i) => (
                    <div key={i} className="h-2 bg-slate-100 rounded" style={{ width: `${w * 100}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Fade out at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none" />
          </div>

          {/* Match score glow */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]">
              94% match
            </div>
          </div>
        </section>

        {/* ── Features bento grid ─────────────────────────────────────────────── */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                get hired faster
              </span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Not just a resume builder — a complete career acceleration toolkit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`group relative bg-gradient-to-br ${f.bg} to-transparent border ${f.border} rounded-3xl p-8 overflow-hidden hover:scale-[1.01] transition-all duration-300 cursor-default`}
              >
                <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/5 border border-white/10 mb-5 ${f.color}`}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Zap size={12} /> How it works
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Resume ready in{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                3 steps
              </span>
            </h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-8 top-10 bottom-10 w-px bg-gradient-to-b from-indigo-500/50 via-violet-500/50 to-blue-500/50 hidden md:block" />

            <div className="space-y-6">
              {STEPS.map((s, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center font-black text-indigo-400 text-lg group-hover:from-indigo-600/30 group-hover:border-indigo-500/40 transition-all duration-300">
                    {s.n}
                  </div>
                  <div className="pt-3">
                    <h3 className="text-lg font-bold text-white mb-1">{s.title}</h3>
                    <p className="text-slate-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Loved by job seekers
            </h2>
            <p className="text-slate-400">Real results from real people.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 hover:bg-white/[0.05] hover:border-white/15 transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-6 py-16 pb-32">
          <div className="relative bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-blue-600/10 border border-indigo-500/20 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent" />
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-indigo-300 mb-6">
                <CheckCircle2 size={12} /> No credit card required
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Ready to get placed?
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Join thousands of professionals who landed their dream jobs with getPlaced.
              </p>
              <Link href="/signup">
                <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-10 py-4 rounded-2xl shadow-2xl shadow-indigo-500/30 border border-indigo-500/30 transition-all duration-300 hover:scale-[1.02] text-lg">
                  Start for free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-slate-400 hover:text-white transition-colors">
            <div className="h-6 w-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-md flex items-center justify-center">
              <Sparkles size={12} fill="white" className="text-white" />
            </div>
            getPlaced
          </Link>
          <div className="flex items-center gap-6 text-xs text-slate-600">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/faq" className="hover:text-slate-400 transition-colors">FAQ</Link>
          </div>
          <p className="text-xs text-slate-700">© 2026 getPlaced. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
