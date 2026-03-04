import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Zap, FileText, Brain, Shield, Layout, ArrowRight, Layers } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export const metadata: Metadata = {
  title: "Features — AI Resume Builder Tools",
  description: "AI-powered writing, ATS-optimized templates, real-time job tailoring, LaTeX-quality PDFs, and cover letter generation. Everything you need to get hired faster.",
};

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Writing",
    description: "Our advanced Gemini AI rewrites your bullet points to be result-oriented, fixing grammar and tone instantly."
  },
  {
    icon: Layout,
    title: "ATS-Optimized Templates",
    description: "Designed by HR experts, our templates are guaranteed to pass Applicant Tracking Systems (ATS) filters."
  },
  {
    icon: Zap,
    title: "Real-time Tailoring",
    description: "Paste a job description, and watch as our AI suggests specific keywords to add to your resume for that role."
  },
  {
    icon: FileText,
    title: "LaTeX Quality PDF",
    description: "Get the crisp, professional look of LaTeX without writing a single line of code. Perfect alignment, every time."
  },
  {
    icon: Shield,
    title: "Data Privacy First",
    description: "Your personal data is locked to your account. We don't sell your data to recruiters. You control your privacy."
  },
  {
    icon: CheckCircle2,
    title: "Cover Letter Generator",
    description: "Don't just stop at the resume. Generate a matching cover letter for your dream job in seconds."
  }
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans">

      {/* ── Ambient ─────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[100px]" />
      </div>

      <PublicNavbar currentPath="/features" />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <main className="relative z-10">
        <section className="text-center max-w-4xl mx-auto px-6 pt-16 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-indigo-300 mb-6">
            <Layers size={12} /> Everything you need
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">Features that</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">get you hired.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Everything you need to build a world-class resume, powered by AI and designed for success.
          </p>
        </section>

        {/* ── Feature Grid ──────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group relative bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 overflow-hidden hover:scale-[1.02] hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-300 cursor-default hover:shadow-xl hover:shadow-white/[0.03]"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] mb-5 text-slate-400 group-hover:text-white group-hover:bg-white/[0.10] transition-all duration-300">
                  <f.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-6 py-16 pb-32">
          <div className="relative bg-gradient-to-br from-indigo-600/15 via-violet-600/8 to-blue-600/8 border border-indigo-500/15 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
                Ready to build your masterpiece?
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Join thousands of students and professionals getting placed at top companies.
              </p>
              <Link href="/signup">
                <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-10 py-4 rounded-2xl shadow-2xl shadow-indigo-500/30 border border-indigo-500/30 transition-all duration-300 hover:scale-[1.02] text-lg">
                  Start Building Now
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
