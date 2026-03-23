import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the getPlaced team for support, business inquiries, or general feedback.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#030814] text-slate-100 font-sans flex flex-col">
      <PublicNavbar currentPath="/contact" />

      <main className="relative z-10 flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-14">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="mt-3 text-slate-300 max-w-2xl">
            Have a question, issue, or partnership inquiry? We are here to help.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <section className="glass-card rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-3">Support & Help</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Facing an issue with resume generation, payments, or credits? Reach out and we will help quickly.
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-1">Email</p>
                <a href="mailto:support@getplaced.online" className="text-blue-300 hover:text-blue-200 font-medium">
                  support@getplaced.online
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-1">Response Time</p>
                <p className="text-slate-200">Within 24-48 hours</p>
              </div>
            </div>
          </section>

          <section className="glass-card rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-3">Business Inquiries</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              For partnerships, media requests, or organization-level plans, contact our team directly.
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-1">Email</p>
                <a href="mailto:support@getplaced.online" className="text-blue-300 hover:text-blue-200 font-medium">
                  support@getplaced.online
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400 mb-1">Company</p>
                <p className="text-slate-200">getPlaced Technologies Ltd.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
