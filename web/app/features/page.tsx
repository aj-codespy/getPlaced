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
    description: "Our Gemini-powered engine rewrites bullets to be impact-driven, concise, and role-aligned.",
  },
  {
    icon: Layout,
    title: "ATS-Optimized Templates",
    description: "Professional structures designed to pass ATS filters without sacrificing readability.",
  },
  {
    icon: Zap,
    title: "Real-time Tailoring",
    description: "Paste a job description and instantly get keyword, skill, and tone-aligned rewrites.",
  },
  {
    icon: FileText,
    title: "LaTeX Quality PDF",
    description: "Generate polished, recruiter-ready PDFs with strong hierarchy and layout consistency.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays under your account and control. No data selling, no recruiter resale.",
  },
  {
    icon: CheckCircle2,
    title: "Cover Letter Generator",
    description: "Generate matching cover letters aligned with your resume and the target role.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#030814] text-slate-100 font-sans flex flex-col">
      <PublicNavbar currentPath="/features" />

      <main className="relative z-10 flex-1">
        <section className="mx-auto max-w-[1080px] px-4 sm:px-6 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-200 mb-6">
            <Layers size={12} /> Built for interview outcomes
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5">
            <span className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">Features that</span>
            <br />
            <span className="bg-gradient-to-r from-[#8fc9ff] via-[#9aa8ff] to-[#b97bff] bg-clip-text text-transparent">
              get you hired faster.
            </span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            A unified AI toolkit to build, tailor, score, and improve your resume workflow end-to-end.
          </p>
        </section>

        <section className="mx-auto max-w-[1180px] px-4 sm:px-6 pb-14">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((item, i) => (
              <div key={i} className="glass-card rounded-3xl p-8">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] text-blue-200">
                  <item.icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1080px] px-4 sm:px-6 pb-20">
          <div className="glass-card rounded-3xl p-10 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
              Ready to build your interview-winning resume?
            </h2>
            <p className="text-slate-300 mb-8">Start free, then scale with credits and premium workflows as needed.</p>
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#7448ff] to-[#9f3bff] px-8 py-3.5 text-lg font-semibold text-white shadow-[0_16px_40px_rgba(116,72,255,0.4)] transition-transform hover:scale-[1.02]">
                Start Building
                <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
