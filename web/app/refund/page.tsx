import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Learn about getPlaced's policies regarding subscription cancellations, refunds, and service disputes.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <PublicNavbar currentPath="/refund" />

      <main className="relative z-10 flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Refund & Cancellation Policy
        </h1>
        <p className="text-slate-400 mb-12">
          Effective Date: January 2026
        </p>

        <div className="space-y-10 text-slate-300 leading-relaxed text-sm">
          <section>
            <h3 className="text-white font-bold text-lg mb-4">1. General Refund Policy</h3>
            <p className="mb-4">
              At getPlaced, we offer digital services and products (AI-generated resumes, templates, and profile analysis). Because our products are entirely digital and delivered instantly upon generation, <strong>we generally do not offer refunds</strong> once a subscription has been purchased or credits have been utilized.
            </p>
            <p>
              We highly encourage you to utilize our Free Tier to evaluate the quality of our resume generation before committing to a paid plan.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">2. Exceptions for Refunds</h3>
            <p className="mb-4">Refunds will only be considered under the following rare circumstances:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li><strong>Duplicate billing:</strong> If you were unintentionally charged more than once for the same subscription period.</li>
              <li><strong>Major service disruption:</strong> If a persistent, documented technical error on our end prevented you from accessing the service entirely for a period of 48 hours or more.</li>
            </ul>
            <p className="mt-4">
              To request a refund under these conditions, you must email <a href="mailto:support@getplaced.online" className="text-indigo-400 hover:underline">support@getplaced.online</a> within 7 days of the transaction.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">3. Subscription Cancellation</h3>
            <p className="mb-4">
              If you are on an auto-renewing subscription (e.g., Monthly or Annual Pro plan), you can cancel your subscription at any time from your account Dashboard. 
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
              <li>When you cancel, you will not be charged on the next billing date.</li>
              <li>You will continue to have access to your plan&apos;s premium features and remaining credits until the end of your current billing cycle.</li>
              <li>We do not offer prorated refunds for mid-cycle cancellations.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">4. Payment Failures & Disputes</h3>
            <p className="mb-4">
              If a payment fails while upgrading, your account will remain on the Free Tier until the transaction succeeds. For issues involving failed transactions where money is debited from your bank but does not reach us, please contact your bank or reach out to us with your transaction ID, and we will liaise with Razorpay to resolve it.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold text-lg mb-4">5. Contact Us</h3>
            <p>
              For any payment or billing questions, please reach out to our team at <a href="mailto:support@getplaced.online" className="text-indigo-400 hover:underline">support@getplaced.online</a>. We strive to respond within 24-48 hours.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
