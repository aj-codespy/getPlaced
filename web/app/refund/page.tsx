import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Learn about getPlaced's policies regarding subscription cancellations, refunds, and service disputes.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#030814] text-slate-100 font-sans flex flex-col">
      <PublicNavbar currentPath="/refund" />

      <main className="relative z-10 flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-14">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            Refund & Cancellation Policy
          </h1>
          <p className="mt-2 text-sm text-slate-400">Effective Date: January 2026</p>
        </div>

        <div className="glass-card rounded-3xl p-8 sm:p-10 space-y-10 text-slate-200 text-sm leading-relaxed">
          <section>
            <h3 className="text-white font-bold text-xl mb-3">1. General Refund Policy</h3>
            <p className="mb-3">
              getPlaced delivers digital AI services instantly. Because of this, we generally do not offer refunds once a
              plan is purchased or credits are consumed.
            </p>
            <p>We recommend using the free tier first to evaluate quality before upgrading.</p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">2. Exceptions for Refunds</h3>
            <p className="mb-3">Refunds are considered only in rare cases such as:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Duplicate billing for the same subscription period.</li>
              <li>Major verified service disruption for 48+ hours.</li>
            </ul>
            <p className="mt-3">
              For eligible cases, email{" "}
              <a href="mailto:support@getplaced.online" className="text-blue-300 hover:text-blue-200 underline underline-offset-4">
                support@getplaced.online
              </a>{" "}
              within 7 days of transaction.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">3. Subscription Cancellation</h3>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>You can cancel auto-renewal anytime from your account dashboard.</li>
              <li>Access continues until the current billing cycle ends.</li>
              <li>No prorated refunds for mid-cycle cancellations.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">4. Payment Failures & Disputes</h3>
            <p>
              If payment fails, your account stays on the free tier. For failed transactions where funds were debited,
              contact support with your transaction ID and we will coordinate with Razorpay.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-xl mb-3">5. Contact Us</h3>
            <p>
              For billing questions, contact{" "}
              <a href="mailto:support@getplaced.online" className="text-blue-300 hover:text-blue-200 underline underline-offset-4">
                support@getplaced.online
              </a>. We typically respond within 24-48 hours.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
