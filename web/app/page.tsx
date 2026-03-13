"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  MousePointer2,
  CheckCircle2,
  FileText,
  ChevronRight,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

const FEATURES = [
  {
    icon: Zap,
    title: "30-Second Custom Resumes",
    desc: "Paste any job description — our AI rewrites your resume to match it in seconds, not hours. Every bullet, every keyword, perfectly tailored.",
  },
  {
    icon: TrendingUp,
    title: "Beat the ATS, Every Time",
    desc: "75% of resumes are rejected before a human ever sees them. Ours are engineered with the right keywords, action verbs, and formatting to pass every filter.",
  },
  {
    icon: FileText,
    title: "Professional-Grade Templates",
    desc: "LaTeX-compiled, pixel-perfect templates designed for every industry — from tech startups to Fortune 500 boardrooms.",
  },
  {
    icon: Shield,
    title: "LinkedIn Profile Audit",
    desc: "Your resume gets you the interview, your LinkedIn closes the deal. Get AI-powered suggestions to make recruiters come to you.",
  },
];

const STEPS = [
  { n: "01", title: "Add your background once", desc: "Drop in your experience, education, and skills. You'll never type it again." },
  { n: "02", title: "Paste any job description", desc: "Our AI analyzes the role and rewrites your resume to match — the right keywords, the right tone." },
  { n: "03", title: "Download & apply", desc: "Choose a template, download a recruiter-ready PDF, and apply with confidence." },
];


export default function LandingPage() {
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

      <PublicNavbar currentPath="/" />

      <main className="relative z-10">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="text-center max-w-5xl mx-auto px-4 pt-16 pb-8">



          <h1 className="text-5xl sm:text-6xl md:text-[80px] font-extrabold tracking-tight leading-[1.05] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            <span className="bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
              Apply less.
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              Land more interviews.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Most resumes get rejected in 6 seconds. getPlaced reads the job description and rebuilds your resume to match it — every keyword, every skill, every time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/signup">
              <button className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-500/30 border border-indigo-500/30 transition-all duration-300 hover:shadow-indigo-500/50 hover:scale-[1.02] text-base">
                <FileText size={18} />
                Build my resume — free
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                See plans <ChevronRight size={14} />
              </button>
            </Link>
          </div>

          {/* Product highlights */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 animate-in fade-in duration-700 delay-500">
            {["Free to start", "Beats ATS filters", "Multiple templates", "No credit card needed"].map((label) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-3.5 py-1.5 text-xs text-slate-400">
                <CheckCircle2 size={12} className="text-indigo-400" />
                {label}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 animate-in fade-in duration-700 delay-500">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Featured on Product Hunt
            </p>
            <a
              href="https://www.producthunt.com/products/getplaced?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-getplaced"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="getPlaced on Product Hunt"
            >
              <Image
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1095203&theme=neutral&t=1773231686280"
                alt="getPlaced - Generate Resumes that get you hired | Product Hunt"
                width={250}
                height={54}
                className="h-auto w-[220px] sm:w-[250px] rounded-md transition-opacity hover:opacity-90"
              />
            </a>
          </div>
        </section>

        {/* ── Hero visual: floating resume mockup ────────────────────────────── */}
        <section className="relative max-w-5xl mx-auto px-4 py-8 flex justify-center">
          {/* Floating AI chips */}
          <div className="absolute top-20 left-[5%] md:left-[8%] z-20 animate-float delay-1000 hidden md:flex items-center gap-2 bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl">
            <Zap size={12} className="text-indigo-400" />
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

          {/* Resume card — floating */}
          <div
            className="relative w-full max-w-[580px] animate-float-slow"
            style={{ perspective: "2000px" }}
          >
            <div
              className="bg-white rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden"
              style={{ transform: "rotateX(16deg) scale(0.92)", transformOrigin: "center top" }}
            >
              {/* Resume header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-7 py-5">
                <h3 className="text-white font-bold text-lg tracking-tight leading-tight">Simon Martin</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Full Stack Developer</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[10px] text-slate-500">
                  <span>simon.martin@email.com</span>
                  <span>+1 (415) 839-2741</span>
                  <span>San Francisco, CA</span>
                  <span>linkedin.com/in/simonmartin</span>
                </div>
              </div>

              {/* Resume body */}
              <div className="px-7 py-5 grid grid-cols-3 gap-6 text-[10px] leading-relaxed">

                {/* Left column */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {["React", "Next.js", "Node.js", "Python", "TypeScript", "AWS", "Docker", "PostgreSQL"].map(s => (
                        <span key={s} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">Education</h4>
                    <p className="font-semibold text-slate-700">B.Tech Computer Science</p>
                    <p className="text-slate-500">Westbrook University &bull; 2020&ndash;2024</p>
                    <p className="text-slate-500 mt-0.5">GPA: 3.9/4.0</p>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">Certifications</h4>
                    <p className="text-slate-600">AWS Solutions Architect</p>
                    <p className="text-slate-600">Google Cloud Professional</p>
                  </div>
                </div>

                {/* Right column */}
                <div className="col-span-2 space-y-4">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">Experience</h4>
                    <div>
                      <div className="flex justify-between items-baseline">
                        <p className="font-semibold text-slate-700">Senior Software Engineer</p>
                        <p className="text-slate-400 text-[9px]">2023&ndash;Present</p>
                      </div>
                      <p className="text-slate-500 italic">NovaPay &bull; San Francisco</p>
                      <ul className="mt-1 space-y-0.5 text-slate-600">
                        <li className="flex gap-1"><span className="text-indigo-400 mt-[3px]">&bull;</span>Architected microservices handling 2M+ daily transactions</li>
                        <li className="flex gap-1"><span className="text-indigo-400 mt-[3px]">&bull;</span>Reduced API latency by 40% through caching layer redesign</li>
                      </ul>
                    </div>
                    {/* Highlighted line — AI-optimized */}
                    <div className="bg-indigo-50 border-l-2 border-indigo-400 pl-2.5 py-1.5 rounded-r mt-2">
                      <p className="text-indigo-700 font-medium">Led a cross-functional team of 8 engineers to deliver a payment gateway serving 150K+ merchants, increasing revenue by 23% QoQ</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline">
                      <p className="font-semibold text-slate-700">Software Developer</p>
                      <p className="text-slate-400 text-[9px]">2021&ndash;2023</p>
                    </div>
                    <p className="text-slate-500 italic">Stackridge &bull; Austin</p>
                    <ul className="mt-1 space-y-0.5 text-slate-600">
                      <li className="flex gap-1"><span className="text-slate-300 mt-[3px]">&bull;</span>Built real-time inventory system for 500K+ SKUs</li>
                      <li className="flex gap-1"><span className="text-slate-300 mt-[3px]">&bull;</span>Implemented CI/CD pipelines reducing deploy time by 60%</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Fade out at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Match score glow */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]">
              94% match
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">Why it works</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Built for people who are{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                tired of hearing nothing back
              </span>
            </h2>
          </div>

          {/* Asymmetric bento grid */}
          <div className="grid md:grid-cols-5 gap-4">

            {/* Hero card — spans 3 cols */}
            <div className="md:col-span-3 feature-card rounded-3xl p-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/[0.04] rounded-full blur-3xl pointer-events-none" />
              <span className="feature-number text-[80px] font-black absolute top-4 right-8 leading-none select-none">01</span>
              <div className="relative z-10">
                <div className="feature-icon inline-flex items-center justify-center h-11 w-11 rounded-xl bg-white/[0.05] border border-white/[0.08] mb-6">
                  <Zap size={20} className="text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{FEATURES[0].title}</h3>
                <p className="text-slate-400 leading-relaxed max-w-md">{FEATURES[0].desc}</p>
              </div>
            </div>

            {/* Card 2 — spans 2 cols */}
            <div className="md:col-span-2 feature-card rounded-3xl p-8 overflow-hidden">
              <span className="feature-number text-[80px] font-black absolute top-4 right-6 leading-none select-none">02</span>
              <div className="relative z-10">
                <div className="feature-icon inline-flex items-center justify-center h-11 w-11 rounded-xl bg-white/[0.05] border border-white/[0.08] mb-6">
                  <TrendingUp size={20} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{FEATURES[1].title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{FEATURES[1].desc}</p>
              </div>
            </div>

            {/* Card 3 — spans 2 cols */}
            <div className="md:col-span-2 feature-card rounded-3xl p-8 overflow-hidden">
              <span className="feature-number text-[80px] font-black absolute top-4 right-6 leading-none select-none">03</span>
              <div className="relative z-10">
                <div className="feature-icon inline-flex items-center justify-center h-11 w-11 rounded-xl bg-white/[0.05] border border-white/[0.08] mb-6">
                  <FileText size={20} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{FEATURES[2].title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{FEATURES[2].desc}</p>
              </div>
            </div>

            {/* Card 4 — spans 3 cols */}
            <div className="md:col-span-3 feature-card rounded-3xl p-10 overflow-hidden">
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/[0.04] rounded-full blur-3xl pointer-events-none" />
              <span className="feature-number text-[80px] font-black absolute top-4 right-8 leading-none select-none">04</span>
              <div className="relative z-10">
                <div className="feature-icon inline-flex items-center justify-center h-11 w-11 rounded-xl bg-white/[0.05] border border-white/[0.08] mb-6">
                  <Shield size={20} className="text-slate-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{FEATURES[3].title}</h3>
                <p className="text-slate-400 leading-relaxed max-w-md">{FEATURES[3].desc}</p>
              </div>
            </div>

          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Zap size={12} /> How it works
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              From zero to interview-ready in{" "}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                3 steps
              </span>
            </h2>
          </div>

          <div className="relative">
            <div className="space-y-6">
              {STEPS.map((s, i) => (
                <div key={i} className="relative">
                  {/* Connector line between this card and the next */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-8 top-16 h-6 w-px bg-gradient-to-b from-indigo-500/40 to-violet-500/40 hidden md:block" />
                  )}
                  <div className="flex gap-6 items-start group">
                    <div className="shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center font-black text-indigo-400 text-lg group-hover:from-indigo-600/30 group-hover:border-indigo-500/40 transition-all duration-300 relative z-10">
                      {s.n}
                    </div>
                    <div className="pt-3">
                      <h3 className="text-lg font-bold text-white mb-1">{s.title}</h3>
                      <p className="text-slate-400">{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                Your next interview is one resume away.
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Stop tweaking the same resume. Build one that actually matches the job — in 30 seconds.
              </p>
              <Link href="/signup">
                <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-10 py-4 rounded-2xl shadow-2xl shadow-indigo-500/30 border border-indigo-500/30 transition-all duration-300 hover:scale-[1.02] text-lg">
                  Build my resume — free
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
