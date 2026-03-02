import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { Sparkles, ArrowRight, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description: "Get answers to common questions about getPlaced — pricing, AI resume generation, ATS optimization, subscriptions, and student discounts.",
};


const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes! You can create one resume and download it as a TXT file completely for free. No credit card required. To unlock PDF downloads and unlimited resumes, you can upgrade to Pro."
  },
  {
    q: "How does the AI work?",
    a: "We use Google's advanced Gemini AI. It analyzes your input (experience, education) and rewrites it to be more professional, action-oriented, and grammatically correct. It can also tailor your resume to a specific job description."
  },
  {
    q: "What is an ATS friendly resume?",
    a: "ATS (Applicant Tracking Systems) are software used by recruiters to filter resumes. Complex layouts often get garbled. Our templates are built with standard formatting that machines can read easily, ensuring your resume actually reaches a human."
  },
  {
    q: "Can I cancel my subscription?",
    a: "Absolutely. You can cancel anytime from your dashboard. You will retain access until the end of your billing period."
  },
  {
    q: "Do you offer student discounts?",
    a: "Our pricing is already optimized for students (less than the price of a movie ticket). However, we do run seasonal promotions, so keep an eye out!"
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans flex flex-col">

      {/* ── Ambient ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[15%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-15%] left-[10%] w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
          <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={16} fill="white" className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">getPlaced</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link href="/features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/faq" className="text-white">FAQ</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors">Log in</Link>
          <Link href="/signup">
            <button className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-500/50 transition-all">
              Get started free
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-3xl mx-auto px-6 py-16 w-full">

        <div className="text-center mb-14 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-violet-300 mb-6">
            <HelpCircle size={12} /> Got questions?
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">Frequently Asked</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Questions.</span>
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Have a different question? Contact our support team.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-6 overflow-hidden hover:border-white/10 transition-colors data-[state=open]:border-indigo-500/20 data-[state=open]:bg-indigo-500/[0.03]"
            >
              <AccordionTrigger className="text-left py-5 text-base font-semibold text-white hover:text-indigo-200 transition-colors hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 text-sm leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* mini CTA */}
        <div className="text-center mt-16 animate-in fade-in duration-700 delay-400">
          <p className="text-sm text-slate-500 mb-4">Still have questions?</p>
          <Link href="/signup">
            <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-500/30 transition-all hover:scale-[1.02]">
              Try getPlaced free
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
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
            <Link href="/features" className="hover:text-slate-400 transition-colors">Features</Link>
          </div>
          <p className="text-xs text-slate-700">© 2026 getPlaced. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
