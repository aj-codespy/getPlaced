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
    <div className="min-h-screen bg-[#030814] text-slate-100 font-sans flex flex-col">
      <PublicNavbar currentPath="/terms" />

      <main className="relative z-10 flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-14">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-slate-400">Effective: January 2026</p>
        </div>

        <div className="glass-card rounded-3xl p-8 sm:p-10 space-y-10 text-slate-200 text-sm leading-relaxed">
          <section>
            <h3 className="text-white font-bold text-xl mb-3">1. Acceptance of Terms</h3>
            <p>
              By accessing or using getPlaced, you agree to be bound by these Terms of Service. If you do not agree to
              all the terms and conditions, you must not use our services.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">2. Description of Service</h3>
            <p>
              getPlaced provides AI-powered resume building, ATS optimization, and cover letter generation tools. While
              we strive for high accuracy using advanced LLMs, we do not guarantee employment, interviews, or that
              generated content is entirely error-free. You must review and verify all generated resumes before submitting.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">3. Acceptable Use & Account Rules</h3>
            <p>You agree not to misuse the getPlaced services. Specifically, you must not:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-300 mt-3">
              <li>Create multiple free accounts to circumvent usage limits.</li>
              <li>Use the service to generate harmful, illegal, or discriminatory content.</li>
              <li>Attempt to scrape, reverse-engineer, or systematically extract data or AI prompts from our platform.</li>
              <li>Share your account credentials with others.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these rules without prior notice or refund.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">4. Payments, Subscriptions, and Refunds</h3>
            <p className="mb-3">
              All transactions are securely processed via Razorpay. By purchasing a paid plan, you agree to the pricing
              and billing frequency presented at checkout.
            </p>
            <p>
              Because our product delivers digital goods instantly, <strong>we generally do not offer refunds</strong>{" "}
              for completed payments, except in cases of billing errors or extended service outages. For full details,
              read our{" "}
              <Link href="/refund" className="text-blue-300 hover:text-blue-200 underline underline-offset-4">
                Refund & Cancellation Policy
              </Link>.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">5. Intellectual Property</h3>
            <p className="mb-3">
              <strong>Your Content:</strong> You retain ownership rights to your personal data and initial content. You
              grant us a temporary license to process this data solely to provide the service.
            </p>
            <p>
              <strong>Our Platform:</strong> The getPlaced website, code, UI, and templates are owned by getPlaced and
              protected by applicable intellectual property laws.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">6. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by law, getPlaced shall not be liable for indirect or consequential damages
              resulting from your use of the service. Our maximum liability shall not exceed the amount you paid in the 12
              months preceding the claim.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">7. Service Availability</h3>
            <p>
              We strive for high uptime, but uninterrupted access cannot be guaranteed. Maintenance and upgrades may
              occasionally cause temporary service disruption.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
