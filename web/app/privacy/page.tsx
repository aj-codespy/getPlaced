import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how getPlaced collects, uses, and protects your personal data. We do not sell your data to third-party recruiters.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#030814] text-slate-100 font-sans flex flex-col">
      <PublicNavbar currentPath="/privacy" />

      <main className="relative z-10 flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-14">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-400">Last updated: January 2026</p>
        </div>

        <div className="glass-card rounded-3xl p-8 sm:p-10 space-y-10 text-slate-200 text-sm leading-relaxed">
          <p className="text-slate-300">
            At getPlaced, we respect your privacy and are committed to protecting it. This policy outlines how we collect,
            use, and safeguard your information when you use our resume and career services.
          </p>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">1. Information We Collect</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li><strong>Account Information:</strong> Name, email address, and authentication data.</li>
              <li><strong>Resume Content:</strong> Experience, education, skills, projects, and related inputs.</li>
              <li><strong>Payment Information:</strong> Processed by Dodo Payments; full card details are not stored by us.</li>
              <li><strong>Usage Data:</strong> Session and analytics signals to improve reliability and product quality.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">2. How We Use Your Information</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>To generate resumes, ATS analysis, and cover letters.</li>
              <li>To secure your account and maintain platform reliability.</li>
              <li>To process purchases and manage billing.</li>
              <li>To provide customer support and service-related notifications.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">3. Third-Party Services & Data Sharing</h3>
            <p className="mb-3">We never sell your data to recruiters, advertisers, or brokers.</p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li><strong>AI Providers (Google Gemini):</strong> Used to process prompts and generate responses.</li>
              <li><strong>Dodo Payments:</strong> Used for secure payment processing.</li>
              <li><strong>Hosting & Database Providers:</strong> Used for account and resume storage.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">4. Data Retention and Deletion</h3>
            <p className="mb-3">
              We retain your data while your account is active. Upon eligible deletion requests, account and resume data
              is removed except where legally required for financial/compliance records.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">5. Contact Information</h3>
            <p>
              Questions or concerns can be sent to{" "}
              <a href="mailto:support@getplaced.online" className="text-blue-300 hover:text-blue-200 underline underline-offset-4">
                support@getplaced.online
              </a>.
            </p>
          </section>

          <div className="rounded-2xl border border-blue-400/25 bg-blue-500/10 p-5 text-blue-100">
            <h4 className="font-bold mb-1">Our Core Promise</h4>
            <p>We are built to help job seekers. We do not sell personal data under any circumstances.</p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
