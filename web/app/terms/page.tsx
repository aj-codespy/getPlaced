import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the terms and conditions for using getPlaced — account rules, usage limits, payment policies, and intellectual property rights.",
};


export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans flex flex-col">
      {/* ── Ambient ──────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-[-15%] left-[15%] w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[120px]" />
      </div>

      {/* ── Navbar ───────────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
          <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={16} fill="white" className="text-white" />
          </div>
          <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">getPlaced</span>
        </Link>
        <Link href="/signup">
          <button className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-500/50 transition-all">
            Get started free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Link>
      </nav>

      {/* ── Content ──────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Terms of Service</h1>
        <p className="text-sm text-slate-600 mb-10">Effective: January 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed text-sm">
          <section>
            <h3 className="text-white font-bold text-base mb-3">1. Acceptance of Terms</h3>
            <p>By accessing getPlaced, you agree to these terms. If you do not agree, please do not use the service.</p>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-3">2. Usage Limits</h3>
            <p>Free accounts are limited to 1 resume. Automated scraping of our services is prohibited.</p>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-3">3. Payment</h3>
            <p>Payments are non-refundable unless specified otherwise. We use Razorpay for processing transactions.</p>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-3">4. Intellectual Property</h3>
            <p>You retain ownership of all content you create using getPlaced. We do not claim any rights to your resume data, generated content, or uploaded materials.</p>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-3">5. Account Termination</h3>
            <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in abuse of the service.</p>
          </section>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
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
            <Link href="/terms" className="text-slate-400">Terms</Link>
            <Link href="/faq" className="hover:text-slate-400 transition-colors">FAQ</Link>
          </div>
          <p className="text-xs text-slate-700">© 2026 getPlaced. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
