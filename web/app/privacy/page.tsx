import type { Metadata } from "next";

import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

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

      <PublicNavbar currentPath="/privacy" />

      {/* ── Content ──────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Privacy Policy</h1>
        <p className="text-sm text-slate-600 mb-10">Last updated: January 2026</p>

        <div className="space-y-10 text-slate-300 leading-relaxed text-sm">
          <p className="text-lg text-slate-400">
            At getPlaced, we respect your privacy and are committed to protecting it. This Privacy Policy outlines our practices regarding the collection, use, and disclosure of your information when you use our service to analyze, generate, and build your resumes.
          </p>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">1. Information We Collect</h3>
            <p className="mb-4">We collect information that you provide directly to us, as well as data automatically collected when you use our services:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li><strong>Account Information:</strong> When you register, we collect your name, email address, and authentication data via Google OAuth or local credentials.</li>
              <li><strong>Resume Content:</strong> The personal, educational, and professional data you input (experience, education, skills, projects, contact info) to generate your resumes.</li>
              <li><strong>Payment Information:</strong> For paid subscriptions, our payment processor (Razorpay) collects payment details. <strong>We do not store your full credit card or bank account numbers on our servers.</strong></li>
              <li><strong>Usage Data & Cookies:</strong> We use basic analytics and session cookies to improve functionality, track application usage, feature adoption, and errors.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">2. How We Use Your Information</h3>
            <p className="mb-4">The information we collect is used strictly for the operation, security, and improvement of getPlaced:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>To provide the core service: generating resumes, ATS screening analysis, and cover letters.</li>
              <li>To maintain and secure your account and our applications.</li>
              <li>To process your transactions and manage billing.</li>
              <li>To provide customer support and send necessary service, billing, and system update emails to your registered address.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">3. Third-Party Services & Data Sharing</h3>
            <p className="mb-4">In order to provide our service, we rely on established third parties. We strictly never sell your data to recruiters, data brokers, or advertisers.</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li><strong>AI Providers (Google Gemini API):</strong> To generate optimized content, we transmit your resume details and job description inputs to Google&apos;s Gemini API. This data is processed temporarily to generate responses and is not used by Google to train their foundational models.</li>
              <li><strong>Payment Processor (Razorpay):</strong> Billing details are processed securely by Razorpay. Their use of your personal information is governed by their privacy policy.</li>
              <li><strong>Database & Hosting:</strong> User data and generated resumes are stored on securely hosted clouds (e.g., PostgreSQL).</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">4. Data Retention and Deletion</h3>
            <p className="mb-4">
              We retain your personal information and generated resume data only for as long as your account remains active. This allows you to log back in anytime to retrieve, edit, or regenerate your documents.
            </p>
            <p className="mb-4">
              If you request account deletion or if an account is inactive for an extended predefined period, all associated personal data and stored resumes will be permanently deleted from our primary servers, excluding data required to fulfill legal or financial obligations (such as payment invoices).
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">5. Contact Information</h3>
            <p className="mb-4">
              If you have any questions or concerns about this Privacy Policy, your rights, or how we handle your data, please contact us at:
            </p>
            <p className="font-medium text-indigo-400">
              <a href="mailto:support@getplaced.in" className="hover:underline">support@getplaced.in</a>
            </p>
          </section>

          <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-6 text-indigo-200 mt-8">
            <h4 className="font-bold mb-2">Our Core Promise</h4>
            <p className="text-sm">We are built to help job seekers, not exploit them. We do <strong>NOT</strong> sell your personal data to third-party recruiters, HR agencies, or data brokers under any circumstances.</p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
