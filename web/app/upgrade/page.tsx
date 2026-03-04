"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Check, Star, Zap, Shield, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { useSession } from "next-auth/react";

export default function UpgradePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currency, setCurrency] = useState<"INR" | "USD" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => setCurrency(data.country_code === "IN" ? "INR" : "USD"))
      .catch(() => setCurrency("USD"));
  }, []);

  const freeLabel = currency === "USD" ? "$0" : "₹0";
  const proPrice = currency === "USD" ? "$8.99" : "₹299";

  const handleUpgrade = async () => {
    if (!session) {
      router.push("/login?callbackUrl=/upgrade");
      return;
    }

    setLoading(true);

    try {
      // Create Subscription
      const planId = "plan_pro";
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Passing exact plan details
        body: JSON.stringify({ planId, currency }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Initialize Razorpay with subscription parameters
      const options = {
        key: data.keyId,
        subscription_id: data.orderId,
        name: "getPlaced",
        description: `Pro Plan — Monthly Subscription`,
        image: "https://getplaced.in/og-image.png",
        handler: async function (response: { razorpay_subscription_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: planId,
              userEmail: session.user?.email,
            }),
          });
          
          if (verifyRes.ok) {
              alert("Subscription Activated! Welcome to Pro.");
              router.push("/dashboard");
          } else {
              alert("Payment Verification Failed");
          }
        },
        prefill: {
          name: session.user?.name || "",
          email: session.user?.email || "",
          contact: "" 
        },
        notes: {
          address: "getPlaced Monthly Subscription"
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const RazorpayConstructor = (window as Window & typeof globalThis & { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      const rzp = new RazorpayConstructor(options as Record<string, unknown>);
      rzp.open();

    } catch (e: unknown) {
      alert("Payment Failed: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-200 bg-[#030712]">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      {/* Ambient background for public view */}
      {status !== "authenticated" && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[15%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[130px]" />
          <div className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        </div>
      )}

      {status === "authenticated" ? <DashboardHeader /> : <PublicNavbar currentPath="/upgrade" />}

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
           {/* Background accent orbs */}
           <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
           <div className="absolute bottom-0 right-[10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
           
           <div className="container px-4 text-center mx-auto max-w-4xl relative z-10">
              <div className="inline-flex items-center gap-2 mb-6 bg-white/[0.06] text-slate-400 px-4 py-1.5 rounded-full text-sm font-semibold border border-indigo-500/20 animate-slide-up">
                <Crown size={14} /> Unlock Your Potential
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl mb-6 leading-tight animate-slide-up delay-100">
                Supercharge your career with <span className="gradient-text">Pro</span>
              </h1>
              <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up delay-200">
                Get unlimited AI generations, premium templates, and advanced customization to land your dream job 2x faster.
              </p>

               {/* Monthly label */}
               <div className="flex items-center justify-center gap-2 mb-16 animate-slide-up delay-300">
                  <span className="text-sm font-semibold text-slate-400">Billed monthly · Cancel anytime</span>
               </div>
           </div>

           {/* Pricing Cards */}
           <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start stagger-children">
                 
                 {/* Free Plan */}
                 <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
                    <div className="mb-8">
                       <h3 className="text-xl font-bold text-white">Free</h3>
                       <p className="text-slate-500 text-sm mt-2">Perfect for trying out the builder.</p>
                       <div className="mt-6 flex items-baseline gap-1">
                          <span className="text-5xl font-extrabold text-white">{currency ? freeLabel : <span className="inline-block w-16 h-10 bg-white/[0.06] rounded-lg animate-pulse" />}</span>
                          <span className="text-slate-500 font-medium">/ forever</span>
                       </div>
                    </div>
                    <Link href="/builder" className="w-full">
                         <Button variant="outline" className="w-full h-12 text-base font-semibold rounded-xl border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white">
                            Continue Free
                         </Button>
                    </Link>
                    <ul className="space-y-4 mt-8">
                       <FeatureItem included>1 AI Resume Generation</FeatureItem>
                       <FeatureItem included>Basic &quot;Classic&quot; Template</FeatureItem>
                       <FeatureItem included>TXT Download</FeatureItem>
                       <FeatureItem included={false}>PDF &amp; LaTeX Downloads</FeatureItem>
                       <FeatureItem included={false}>Premium Templates (Modern, Business)</FeatureItem>
                       <FeatureItem included={false}>AI Bullet Point Enhancer</FeatureItem>
                       <FeatureItem included={false}>Cover Letter Generator</FeatureItem>
                    </ul>
                 </div>

                 {/* Pro Plan */}
                 <div className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-b from-indigo-950/40 to-[#0a0f1a] border border-indigo-500/20 shadow-2xl shadow-indigo-500/10 transform md:-translate-y-4 md:hover:-translate-y-5 transition-all duration-300 ring-1 ring-indigo-500/10">
                    {/* Top glow */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                    
                    <div className="absolute top-4 right-4">
                        <Crown className="text-amber-400/80 w-7 h-7" />
                    </div>

                    <div className="relative z-10">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                               Pro
                               <span className="text-[10px] font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2.5 py-1 rounded-full tracking-wider">POPULAR</span>
                            </h3>
                            <p className="text-slate-400 text-sm mt-2">Everything you need to get hired.</p>
                            <div className="mt-6 flex items-baseline gap-1">
                                <span className="text-5xl font-extrabold text-white">
                                    {currency ? proPrice : <span className="inline-block w-20 h-10 bg-white/[0.06] rounded-lg animate-pulse" />}
                                </span>
                                <span className="text-slate-400 font-medium">/ month</span>
                            </div>
                            <p className="text-sm text-indigo-400/80 mt-2 font-medium">Billed monthly · Cancel anytime</p>
                        </div>

                        <Button 
                            className="w-full h-12 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 rounded-xl transition-all hover:scale-[1.02]"
                            onClick={handleUpgrade}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                            Upgrade Now
                        </Button>
                        <p className="text-center text-[11px] text-slate-600 mt-3">14-day money-back guarantee. Cancel anytime.</p>

                        <ul className="space-y-4 mt-8">
                            <FeatureItem included pro>Unlimited AI Resumes</FeatureItem>
                            <FeatureItem included pro>Access all 10+ Premium Templates</FeatureItem>
                            <FeatureItem included pro>PDF &amp; LaTeX Source Downloads</FeatureItem>
                            <FeatureItem included pro>Advanced AI Bullet Point Writer</FeatureItem>
                            <FeatureItem included pro>Cover Letter Generator</FeatureItem>
                            <FeatureItem included pro>Priority Support</FeatureItem>
                            <FeatureItem included pro>ATS-Optimized Formats</FeatureItem>
                        </ul>
                    </div>
                 </div>

              </div>
           </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 relative">
           <div className="absolute inset-0 bg-white/[0.01] border-y border-white/[0.03]" />
           <div className="container mx-auto px-4 relative z-10">
               <div className="text-center mb-16 max-w-2xl mx-auto">
                   <h2 className="text-3xl font-bold text-white mb-4">Why upgrade to Pro?</h2>
                   <p className="text-slate-400 text-sm">Join thousands of job seekers who landed interviews at top companies using our premium tools.</p>
               </div>

               <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto stagger-children">
                   <BenefitItem 
                      icon={<Zap className="w-5 h-5 text-amber-400" />}
                      title="Beat the ATS"
                      description="Our templates are designed to pass Applicant Tracking Systems filters, ensuring your resume reaches human eyes."
                   />
                   <BenefitItem 
                      icon={<Star className="w-5 h-5 text-indigo-400" />}
                      title="Stand Out Visually"
                      description="Premium templates designed by HR experts to be clean, modern, and memorable without being flashy."
                   />
                   <BenefitItem 
                      icon={<Shield className="w-5 h-5 text-emerald-400" />}
                      title="Data Privacy"
                      description="Your data is yours. We never sell your resume information to third-party recruiters."
                   />
               </div>
           </div>
        </section>

        {/* Testimonial */}
        <section className="py-20 relative overflow-hidden noise-overlay">
           <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/10 to-transparent" />
           <div className="container mx-auto px-4 text-center relative z-10 max-w-3xl">
               <div className="text-amber-400 flex justify-center gap-1 mb-8">
                   {[1,2,3,4,5].map(i => <Star key={i} size={18} fill="currentColor" strokeWidth={0} />)}
               </div>
               <blockquote className="text-2xl md:text-3xl font-medium leading-relaxed mb-8 text-white/90">
                   &quot;I applied to 50 jobs with my old resume and heard nothing. I used the &apos;Business&apos; template on Pro and got 3 interviews in a week.&quot;
               </blockquote>
               <cite className="not-italic font-bold text-base text-indigo-400">
                   — Sarah J., Software Engineer @ Google
               </cite>
           </div>
        </section>
      </main>
      {status !== "authenticated" && <PublicFooter />}
    </div>
  );
}

function FeatureItem({ children, included, pro }: { children: React.ReactNode, included: boolean, pro?: boolean }) {
    return (
        <li className="flex items-center gap-3">
            <div className={cn(
                "flex items-center justify-center w-5 h-5 rounded-full shrink-0", 
                 included 
                    ? (pro ? "bg-indigo-500/20 text-indigo-400" : "bg-white/[0.06] text-slate-400")
                    : "bg-white/[0.04] text-slate-600"
            )}>
                {included ? <Check size={11} strokeWidth={3} /> : <div className="w-1.5 h-1.5 bg-current rounded-full" />}
            </div>
            <span className={cn(
                "text-sm font-medium",
                included ? "text-slate-300" : "text-slate-600"
            )}>
                {children}
            </span>
        </li>
    )
}

function BenefitItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="glass-card rounded-2xl p-7 text-center group">
            <div className="w-12 h-12 bg-white/[0.04] border border-white/[0.06] rounded-xl flex items-center justify-center mb-5 mx-auto group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="font-bold text-lg text-white mb-2">{title}</h3>
            <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
        </div>
    )
}
