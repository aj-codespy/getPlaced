import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  FileText,
  Funnel,
  ShieldCheck,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

const STEP_ITEMS = [
  {
    n: "01",
    title: "Add your background once.",
    desc: "Drop in your experience, education, and skills. You'll never type it again.",
  },
  {
    n: "02",
    title: "Paste any job description.",
    desc: "Our AI analyzes the role and rewrites your resume to match — the right keywords, the right tone.",
  },
  {
    n: "03",
    title: "Download & apply.",
    desc: "Choose a template, download a recruiter-ready PDF, and apply with confidence.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030814] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(72,127,255,0.24),transparent_38%),radial-gradient(circle_at_78%_28%,rgba(156,80,255,0.22),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(67,179,255,0.14),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(11,16,30,0.25)_0%,rgba(4,8,18,0.8)_45%,rgba(5,8,20,0.96)_100%)]" />
      </div>

      <PublicNavbar currentPath="/" />

      <main className="relative z-10">
        <section className="mx-auto grid w-full max-w-[1240px] items-center gap-10 px-4 pb-12 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-20">
          <div>
            <h1 className="text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-b from-white to-[#d7ddff] bg-clip-text text-transparent">
                Apply less. Land
              </span>
              <br />
              <span className="bg-gradient-to-b from-[#efe5ff] to-[#b3b8ff] bg-clip-text text-transparent">
                more interviews.
              </span>
            </h1>
            <p className="mt-7 max-w-[630px] text-lg leading-relaxed text-slate-300 sm:text-2xl">
              Most resumes get rejected in 6 seconds. getPlaced reads the job description and rebuilds your resume to
              match it — every keyword, every skill, every time.
            </p>
            <div className="mt-10">
              <Link href="/signup">
                <span className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#7447ff] to-[#9d38ff] px-8 py-4 text-xl font-semibold text-white shadow-[0_18px_50px_rgba(117,58,255,0.45)] transition-transform hover:scale-[1.02]">
                  Build my resume — free
                  <ArrowRight size={20} />
                </span>
              </Link>
            </div>
          </div>

          <div className="relative mt-6 lg:mt-0">
            <div className="absolute -top-6 right-6 z-20 rounded-2xl border border-cyan-300/40 bg-[#131b34]/85 px-4 py-3 text-base text-slate-200 shadow-[0_14px_45px_rgba(95,186,255,0.28)] backdrop-blur-xl sm:text-lg">
              <span className="mr-2 text-cyan-300">⚡</span>
              Try: “Led a team of 8 engineers”
            </div>

            <div className="relative mx-auto w-full max-w-[560px] rounded-[28px] border border-white/20 bg-gradient-to-b from-[#dadced] to-[#bfc6e3] p-5 shadow-[0_40px_90px_rgba(20,26,46,0.75)]">
              <div className="rounded-[20px] bg-[#f5f7fb] p-6 text-slate-800">
                <h3 className="text-4xl font-bold text-slate-900">Simon Martin</h3>
                <p className="mt-1 text-xl text-slate-500">Full Stack Developer</p>

                <div className="mt-6">
                  <p className="text-xs font-bold tracking-[0.18em] text-slate-700">SKILLS</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["React", "Next.js", "Node.js", "Python", "TypeScript", "AWS", "Docker", "PostgreSQL"].map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-xs font-bold tracking-[0.18em] text-slate-700">EXPERIENCE</p>
                  <div className="mt-3 border-t border-slate-300 pt-3">
                    <p className="text-base font-semibold text-slate-800">Senior Software Engineer</p>
                    <p className="text-sm text-slate-500">Simon Martin • Arg • Jan 2022</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-600">
                      <li>Built scalable APIs and improved service reliability across teams.</li>
                      <li>Led delivery across a cross-functional group of engineers.</li>
                      <li>Optimized platform workflows for faster recruiting outcomes.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="absolute right-[-18px] top-[118px] rounded-2xl border border-emerald-200/50 bg-emerald-500/25 px-4 py-2.5 text-emerald-100 shadow-[0_12px_30px_rgba(16,185,129,0.35)] backdrop-blur-xl">
                <span className="inline-flex items-center gap-2 text-base font-semibold">
                  <BadgeCheck size={18} className="text-emerald-200" /> ATS Score: 94%
                </span>
              </div>
            </div>

            <p className="mt-5 text-center text-6xl font-bold tracking-tight text-[#cde5ff] drop-shadow-[0_0_28px_rgba(93,153,255,0.42)]">
              94% match
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-4 pb-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-4 text-slate-300">
            <FeaturePill icon={<ShieldCheck size={17} />} label="Free to start" />
            <FeaturePill icon={<Funnel size={17} />} label="Beats ATS filters" />
            <FeaturePill icon={<FileText size={17} />} label="Multiple templates" />
            <FeaturePill icon={<CreditCard size={17} />} label="No credit card needed" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-4 pb-24 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-white/[0.08] bg-[linear-gradient(140deg,rgba(13,23,51,0.9),rgba(7,13,31,0.9))] px-6 py-14 sm:px-10">
            <h2 className="text-center text-5xl font-bold tracking-tight sm:text-6xl">
              <span className="text-white">How it </span>
              <span className="bg-gradient-to-b from-[#59a2ff] to-[#4172ff] bg-clip-text text-transparent">Works</span>
            </h2>

            <div className="mx-auto mt-14 max-w-4xl">
              {STEP_ITEMS.map((step, idx) => (
                <div key={step.n} className="relative flex gap-6 pb-12 last:pb-0">
                  {idx < STEP_ITEMS.length - 1 && (
                    <div className="absolute left-[34px] top-[86px] h-[calc(100%-60px)] w-px bg-gradient-to-b from-[#6f8dff] to-[#9959ff]" />
                  )}
                  <div className="flex-shrink-0">
                    <div className="flex h-[78px] w-[78px] items-center justify-center rounded-3xl border border-white/20 bg-gradient-to-br from-[#3cbcff] via-[#5c81ff] to-[#a84dff] text-5xl font-bold text-white shadow-[0_18px_45px_rgba(111,90,255,0.42)]">
                      {step.n}
                    </div>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-3xl font-semibold text-white sm:text-4xl">{step.title}</h3>
                    <p className="mt-2 max-w-[720px] text-xl leading-relaxed text-slate-300 sm:text-[2rem]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function FeaturePill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-lg">
      <span className="text-slate-400">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
