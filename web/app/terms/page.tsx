import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

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

      <PublicNavbar currentPath="/terms" />

      {/* ── Content ──────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Terms of Service</h1>
        <p className="text-sm text-slate-600 mb-10">Effective: January 2026</p>

        <div className="space-y-10 text-slate-300 leading-relaxed text-sm">
          <section>
            <h3 className="text-white font-bold text-lg mb-4">1. Acceptance of Terms</h3>
            <p className="mb-4">
              By accessing or using getPlaced, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you must not use our services.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">2. Description of Service</h3>
            <p className="mb-4">
              getPlaced provides AI-powered resume building, ATS optimization, and cover letter generation tools. While we strive for the highest accuracy using advanced LLMs (like Google Gemini), we do not guarantee employment, interviews, or that the generated content is entirely error-free. It is your responsibility to review and verify all generated resumes before submitting them to employers.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">3. Acceptable Use & Account Rules</h3>
            <p className="mb-4">You agree not to misuse the getPlaced services. Specifically, you must not:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>Create multiple free accounts to circumvent usage limits.</li>
              <li>Use the service to generate harmful, illegal, or discriminatory content.</li>
              <li>Attempt to scrape, reverse-engineer, or systematically extract data or AI prompts from our platform.</li>
              <li>Share your account credentials with others. Your account is for your personal use only.</li>
            </ul>
            <p className="mt-4">
              We reserve the right to immediately suspend or terminate accounts that violate these rules without prior notice or refund.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">4. Payments, Subscriptions, and Refunds</h3>
            <p className="mb-4">
              All transactions are securely processed via Razorpay. By purchasing a paid plan, you agree to the pricing and billing frequency (e.g., monthly or annually) presented at checkout.
            </p>
            <p className="mb-4">
              Because our product delivers digital goods and AI operations instantaneously, <strong>we generally do not offer refunds</strong> for completed payments, except in cases of billing errors or extended service outages. For full details, please read our <Link href="/refund" className="text-indigo-400 hover:underline">Refund & Cancellation Policy</Link>.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">5. Intellectual Property</h3>
            <p className="mb-4">
              <strong>Your Content:</strong> You retain all ownership rights to the personal data and initial content you provide. You grant us a temporary license to process this data solely to provide the service to you.
            </p>
            <p className="mb-4">
              <strong>Our Platform:</strong> The getPlaced website, its original content, features, code, UI design, and templates are owned by getPlaced and are protected by international copyright and intellectual property laws.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">6. Limitation of Liability</h3>
            <p className="mb-4">
              To the fullest extent permitted by law, getPlaced and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. Our maximum liability for any claim arising out of these terms shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">7. Service Availability</h3>
            <p className="mb-4">
              We strive to keep getPlaced highly available, but we cannot guarantee uninterrupted access. We may occasionally need to perform maintenance or upgrades that could temporarily disrupt service.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
