import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description: "Get answers to common questions about getPlaced — pricing, AI resume generation, ATS optimization, subscriptions, and student discounts.",
};


const FAQS = [
  {
    q: "Is getPlaced really free to use?",
    a: "Yes. You get 200 free credits when you sign up — no credit card needed. That’s enough to generate multiple resumes, test templates, and see real results before you spend anything."
  },
  {
    q: "How does the AI tailor my resume to a job description?",
    a: "When you paste a job description, our AI (powered by Google Gemini) analyzes the role’s requirements, keywords, and tone. It then rewrites your resume bullets to highlight matching experience, injects relevant keywords, and uses action verbs that applicant tracking systems look for."
  },
  {
    q: "What is ATS and why does it matter?",
    a: "ATS (Applicant Tracking System) is software that companies use to filter resumes before a human ever sees them. Over 75% of resumes are rejected by ATS due to formatting issues or missing keywords. Our templates and AI are specifically designed to pass these filters."
  },
  {
    q: "Can I use getPlaced for different job roles?",
    a: "Absolutely. That’s the whole point. Each time you paste a different job description, the AI generates a unique, tailored resume for that specific role. Apply to 10 jobs, get 10 custom resumes."
  },
  {
    q: "What are credits and how do they work?",
    a: "Credits are the currency for using AI features. Generating a resume costs ~100 credits. You get 200 free credits on signup. If you run out, you can purchase more through our Standard or Pro plans."
  },
  {
    q: "What’s the difference between the Standard and Pro plans?",
    a: "The Standard plan gives you 9 resume generations per month along with 1 LinkedIn audit. The Pro plan gives you 25 generations, 3 LinkedIn audits, access to premium templates, and priority AI processing for faster results."
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes — you can cancel anytime from your dashboard. You’ll keep access to your plan’s features until the end of the current billing period. No questions asked."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards, UPI, net banking, and wallet payments through Razorpay. International cards (Visa, Mastercard) are fully supported."
  },
  {
    q: "Do you offer student discounts?",
    a: "Our pricing is already designed to be affordable for students — less than the cost of a coffee. We also run seasonal promotions, so keep an eye on our social channels."
  },
  {
    q: "What templates are available?",
    a: "We offer multiple professional templates including Classic, Modern, Business, Academic, and more. Each is LaTeX-compiled for pixel-perfect typography and layout. Free users get access to basic templates, while paid plans unlock the full library."
  },
  {
    q: "Can I download my resume as a PDF?",
    a: "Yes. All plans support PDF downloads. Your resume is compiled using LaTeX on our backend for a polished, professional output that looks identical on every device and printer."
  },
  {
    q: "My PDF download failed. What should I do?",
    a: "PDF generation depends on our backend service. If a download fails, try again in a few seconds. If it persists, check that your profile has all required fields filled in (name, at least one experience or education entry). Clearing your browser cache can also help."
  },
  {
    q: "Why does my resume generation say 'Failed to optimize'?",
    a: "This usually means our AI service is temporarily overloaded or your session has expired. Try refreshing the page and generating again. If the issue continues, log out and log back in."
  },
  {
    q: "Can I edit my resume after generating it?",
    a: "The AI generates optimized content based on your profile and the job description. To make changes, update your profile data (experience, skills, etc.) and regenerate. Each generation produces a fresh resume."
  },
  {
    q: "Is my data safe and private?",
    a: "Yes. We use Firebase for secure authentication and encrypted data storage. Your resume data is never sold to recruiters, third-party services, or advertisers. You own your data."
  },
  {
    q: "What is the LinkedIn Profile Audit?",
    a: "It’s an AI-powered review of your LinkedIn profile that identifies weak spots and gives specific, actionable suggestions — from your headline and summary to your experience descriptions. Think of it as a free career coach for your online presence."
  },
  {
    q: "Does getPlaced work for non-tech roles?",
    a: "Yes. Our AI and templates work across all industries — marketing, finance, healthcare, education, design, operations, and more. The AI adapts its language and keywords based on the job description you provide."
  },
  {
    q: "Can I use getPlaced outside of India?",
    a: "Absolutely. getPlaced works worldwide. We automatically detect your location and show pricing in your local currency (INR for India, USD for everywhere else). All features are available globally."
  },
  {
    q: "Why am I seeing an error when trying to log in?",
    a: "Make sure you’re using the same Google account you originally signed up with. If you’re seeing a session error, clear your browser cookies for the site and try again. We use Google OAuth, so there are no passwords to reset."
  },
  {
    q: "How many resumes can I create with the free plan?",
    a: "With 200 free credits, you can generate approximately 2 full resumes. Each generation costs about 100 credits. This is enough to see the quality before deciding to upgrade."
  },
  {
    q: "Do my credits expire?",
    a: "Credits from paid plans are refreshed monthly with your subscription. Unused credits do not carry over to the next billing cycle. Free starter credits do not expire."
  },
  {
    q: "Can I get a refund?",
    a: "If you’re unsatisfied with your purchase, contact us within 7 days and we’ll work with you on a resolution. Refunds are handled on a case-by-case basis and processed through Razorpay."
  },
  {
    q: "I have a question that’s not listed here.",
    a: "We’d love to help! Reach out to us at support@getplaced.online and we’ll get back to you as soon as possible. You can also DM us on our social channels."
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#030814] text-slate-100 font-sans flex flex-col">

      {/* ── Ambient ──────────────────────────────────────────────── */}
      <PublicNavbar currentPath="/faq" />

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full">

        <div className="text-center mb-14 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/25 rounded-full px-4 py-1.5 text-xs font-medium text-blue-200 mb-6">
            <HelpCircle size={12} /> Got questions?
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-b from-white via-white to-slate-300 bg-clip-text text-transparent">Frequently Asked</span>
            <br />
            <span className="bg-gradient-to-r from-[#8fc9ff] via-[#9aa8ff] to-[#b97bff] bg-clip-text text-transparent">Questions.</span>
          </h1>
          <p className="text-slate-300 max-w-md mx-auto">
            Have a different question? Contact our support team.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="glass-card rounded-2xl px-6 overflow-hidden transition-colors data-[state=open]:border-blue-400/30"
            >
              <AccordionTrigger className="text-left py-5 text-base font-semibold text-white hover:text-blue-200 transition-colors hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 text-sm leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* mini CTA */}
        <div className="text-center mt-16 animate-in fade-in duration-700 delay-400">
          <p className="text-sm text-slate-400 mb-4">Still have questions?</p>
          <Link href="/signup">
            <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#7448ff] to-[#9f3bff] hover:brightness-110 text-white font-semibold px-8 py-3 rounded-xl shadow-[0_14px_35px_rgba(116,72,255,0.35)] border border-blue-300/15 transition-all hover:scale-[1.02]">
              Try getPlaced free
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
