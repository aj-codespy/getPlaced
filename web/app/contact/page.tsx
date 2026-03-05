import type { Metadata } from "next";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the getPlaced team for support, business inquiries, or general feedback.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <PublicNavbar currentPath="/contact" />

      <main className="relative z-10 flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          Contact Us
        </h1>
        <p className="text-slate-400 mb-12">
          Have a question or need help? We&apos;d love to hear from you.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 hover:bg-white/[0.04] transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Support & Help</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Facing an issue with generating your resume, payment failure, or credit tracking? Reach out to our support team and we&apos;ll resolve it as soon as possible.
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</p>
                <a href="mailto:support@getplaced.online" className="text-indigo-400 hover:text-indigo-300 font-medium">support@getplaced.online</a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Response Time</p>
                <p className="text-slate-300">Within 24-48 hours</p>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 hover:bg-white/[0.04] transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">General Inquiries</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              For business partnerships, media relations, or general questions about getPlaced and our mission to simplify job hunting.
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</p>
                <a href="mailto:support@getplaced.online" className="text-indigo-400 hover:text-indigo-300 font-medium">support@getplaced.online</a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Company Info</p>
                <p className="text-slate-300">getPlaced Technologies Ltd.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
