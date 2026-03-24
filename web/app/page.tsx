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
        <section className="mx-auto grid w-full max-w-[1240px] items-center gap-8 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-16">
          <div>
            <h1 className="text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-b from-white to-[#d7ddff] bg-clip-text text-transparent">
                Apply less. Land
              </span>
              <br />
              <span className="bg-gradient-to-b from-[#efe5ff] to-[#b3b8ff] bg-clip-text text-transparent">
                more interviews.
              </span>
            </h1>
            <p className="mt-6 max-w-[600px] text-base leading-relaxed text-slate-300 sm:text-lg">
              Most resumes get rejected in 6 seconds. getPlaced reads the job description and rebuilds your resume to
              match it — every keyword, every skill, every time.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7447ff] to-[#9d38ff] px-6 py-3 text-base font-semibold text-white shadow-[0_14px_36px_rgba(117,58,255,0.35)] transition-transform hover:scale-[1.02]">
                  Build my resume — free
                  <ArrowRight size={16} />
                </span>
              </Link>
            </div>
          </div>

          <div className="relative mt-4 lg:mt-0">
            <div className="absolute -top-4 right-5 z-20 rounded-xl border border-cyan-300/40 bg-[#131b34]/85 px-3 py-2 text-xs text-slate-200 shadow-[0_10px_30px_rgba(95,186,255,0.26)] backdrop-blur-xl sm:text-sm">
              <span className="mr-2 text-cyan-300">⚡</span>
              Try: “Led a team of 8 engineers”
            </div>

            <div className="relative mx-auto w-full max-w-[510px] rounded-[24px] border border-white/20 bg-gradient-to-b from-[#dadced] to-[#bfc6e3] p-4 shadow-[0_30px_70px_rgba(20,26,46,0.7)]">
              <div className="rounded-[16px] bg-[#f5f7fb] p-5 text-slate-800">
                <h3 className="text-2xl font-bold text-slate-900">Simon Martin</h3>
                <p className="mt-0.5 text-base text-slate-500">Full Stack Developer</p>

                <div className="mt-6">
                  <p className="text-xs font-bold tracking-[0.18em] text-slate-700">SKILLS</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["React", "Next.js", "Node.js", "Python", "TypeScript", "AWS", "Docker", "PostgreSQL"].map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-xs font-bold tracking-[0.18em] text-slate-700">EXPERIENCE</p>
                  <div className="mt-3 border-t border-slate-300 pt-3">
                    <p className="text-sm font-semibold text-slate-800">Senior Software Engineer</p>
                    <p className="text-xs text-slate-500">Simon Martin • Arg • Jan 2022</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-600">
                      <li>Built scalable APIs and improved service reliability across teams.</li>
                      <li>Led delivery across a cross-functional group of engineers.</li>
                      <li>Optimized platform workflows for faster recruiting outcomes.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="absolute right-[-14px] top-[105px] rounded-xl border border-emerald-200/50 bg-emerald-500/25 px-3 py-2 text-emerald-100 shadow-[0_10px_24px_rgba(16,185,129,0.32)] backdrop-blur-xl">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  <BadgeCheck size={15} className="text-emerald-200" /> ATS Score: 94%
                </span>
              </div>
            </div>

            <p className="mt-4 text-center text-4xl font-bold tracking-tight text-[#cde5ff] drop-shadow-[0_0_20px_rgba(93,153,255,0.35)] sm:text-5xl">
              94% match
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-4 pb-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-4 text-slate-300">
            <FeaturePill icon={<ShieldCheck size={17} />} label="Free to start" />
            <FeaturePill icon={<Funnel size={17} />} label="Beats ATS filters" />
            <FeaturePill icon={<FileText size={17} />} label="Multiple templates" />
            <FeaturePill icon={<CreditCard size={17} />} label="No credit card needed" />
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-[24px] border border-white/[0.08] bg-[linear-gradient(140deg,rgba(13,23,51,0.9),rgba(7,13,31,0.9))] px-6 py-12 sm:px-10">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="text-white">How it </span>
              <span className="bg-gradient-to-b from-[#59a2ff] to-[#4172ff] bg-clip-text text-transparent">Works</span>
            </h2>

            <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
              {STEP_ITEMS.map((step) => (
                <div key={step.n} className="glass-card rounded-2xl p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#3cbcff] via-[#5c81ff] to-[#a84dff] text-xl font-bold text-white">
                    {step.n}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.desc}</p>
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
    <div className="inline-flex items-center gap-2 text-sm sm:text-base">
      <span className="text-slate-400">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
