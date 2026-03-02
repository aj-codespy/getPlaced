import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how getPlaced collects, uses, and protects your personal data. We do not sell your data to third-party recruiters.",
};


export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans flex flex-col">
      {/* ── Ambient ──────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[20%] w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px]" />
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
        <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Privacy Policy</h1>
        <p className="text-sm text-slate-600 mb-10">Last updated: January 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed text-sm">
          <p>At getPlaced, we take your privacy seriously. This policy explains how we collect and use your data.</p>

          <section>
            <h3 className="text-white font-bold text-base mb-3">1. Information We Collect</h3>
            <p className="mb-3">We collect information you provide directly to us, such as when you create an account, build a resume, or communicate with us. This includes:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Name and contact information</li>
              <li>Resume content (Experience, Education, etc.)</li>
              <li>Payment information (processed securely by Razorpay)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-base mb-3">2. How We Use Your Information</h3>
            <p className="mb-3">We use your information solely to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 ml-2">
              <li>Provide and improve the getPlaced service</li>
              <li>Generate resumes and cover letters via AI</li>
              <li>Process payments</li>
            </ul>
          </section>

          <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-5 text-indigo-200 font-medium">
            We do <strong>NOT</strong> sell your personal data to third-party recruiters or data brokers.
          </div>
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
            <Link href="/privacy" className="text-slate-400">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/faq" className="hover:text-slate-400 transition-colors">FAQ</Link>
          </div>
          <p className="text-xs text-slate-700">© 2026 getPlaced. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
