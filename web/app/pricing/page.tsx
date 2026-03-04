
"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PRICING_PLANS } from "@/lib/razorpay/pricing";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Zap, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currency, setCurrency] = useState<"INR" | "USD" | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.country_code === "IN") {
          setCurrency("INR");
        } else {
          setCurrency("USD");
        }
      })
      .catch((err) => {
        console.error("Location check failed, defaulting to USD", err);
        setCurrency("USD"); 
      });
  }, []);

  const renderPrice = (plan: typeof PRICING_PLANS.STANDARD) => {
    if (!currency) return <span className="inline-block w-20 h-10 bg-white/[0.06] rounded-lg animate-pulse" />;
    return currency === "INR" ? "₹" + plan.price.INR : "$" + plan.price.USD;
  };;

  const handlePurchase = async (planId: string) => {
    if (!session) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    setLoadingPlan(planId);

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, currency }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "getPlaced",
        description: `Unlock ${planId}`,
        image: "https://getplaced.in/og-image.png",
        order_id: data.orderId,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: planId,
              userEmail: session.user?.email,
            }),
          });
          
          if (verifyRes.ok) {
              alert("Payment Successful! Credits Added.");
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
          address: "getPlaced Pro Subscription"
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
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-200 selection:bg-indigo-500/30">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* Ambient background for public view */}
      {status !== "authenticated" && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[15%] w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[130px]" />
          <div className="absolute top-[40%] right-[-5%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        </div>
      )}

      {status === "authenticated" ? <DashboardHeader /> : <PublicNavbar currentPath="/pricing" />}

      <div className="container mx-auto px-4 relative z-10 pt-16 pb-20">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
                Pick your path to <br/>
                <span className="gradient-text">more interviews.</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
               Every plan gives you AI-tailored resumes that match the job. <br/> The only difference is how many doors you want to open.
            </p>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6 items-start stagger-children">
            
            {/* FREE PLAN */}
            <div className="glass-card rounded-3xl p-8 flex flex-col relative group">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                    <p className="text-slate-500 text-sm h-10">See what a tailored resume looks like.</p>
                    <div className="mt-6 flex items-baseline">
                        <span className="text-5xl font-bold text-white tracking-tighter">0</span>
                    </div>
                </div>

                <Button 
                    variant="outline"
                    className="w-full mb-8 border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white rounded-xl h-12"
                    onClick={() => router.push('/dashboard')}
                >
                    Current Plan
                </Button>

                <ul className="space-y-4 mb-auto">
                     <li className="flex items-center text-sm text-slate-300 gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        200 Starting Credits
                     </li>
                     <li className="flex items-center text-sm text-slate-300 gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        Basic Resume Templates
                     </li>
                      <li className="flex items-center text-sm text-slate-300 gap-3">
                        <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <Check className="h-3.5 w-3.5 text-indigo-400" />
                        </div>
                        Free Resume Scan (1/mo)
                     </li>
                </ul>
            </div>
            
            {/* STANDARD PLAN — MOST POPULAR */}
            <div className="relative rounded-3xl p-8 flex flex-col overflow-hidden bg-gradient-to-b from-indigo-950/50 to-[#0a0f1a] border border-indigo-500/30 shadow-2xl shadow-indigo-500/10 transform md:-translate-y-6 md:hover:-translate-y-7 transition-all duration-300 ring-1 ring-indigo-500/10">
                
                {/* Glow Effect */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                <div className="absolute top-0 right-0 bg-gradient-to-bl from-indigo-600 to-purple-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-bl-xl tracking-widest uppercase shadow-lg z-10">
                    Most Popular
                </div>
                
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-2">{PRICING_PLANS.STANDARD.name}</h3>
                    <p className="text-indigo-200/60 text-sm h-10">For active job seekers who want real results.</p>
                    <div className="mt-6 flex items-baseline text-white">
                        <span className="text-5xl font-bold tracking-tighter">
                            {renderPrice(PRICING_PLANS.STANDARD)}
                        </span>
                        <span className="ml-2 text-indigo-300/60 text-sm font-medium">/month</span>
                    </div>
                </div>

                <Button 
                    onClick={() => handlePurchase(PRICING_PLANS.STANDARD.id)}
                    disabled={!!loadingPlan}
                    className="w-full mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 rounded-xl h-12 font-bold transition-all hover:scale-[1.02]"
                >
                    {loadingPlan === PRICING_PLANS.STANDARD.id ? <Loader2 className="animate-spin" /> : "Get Standard"}
                </Button>

                <ul className="space-y-4">
                    {PRICING_PLANS.STANDARD.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-white font-medium gap-3">
                            <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* PRO PLAN */}
            <div className="glass-card rounded-3xl p-8 flex flex-col relative group hover:border-indigo-500/20 transition-all hover:shadow-2xl hover:shadow-indigo-500/5">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-2">{PRICING_PLANS.PRO.name}</h3>
                    <p className="text-slate-500 text-sm h-10">For power users applying to many roles.</p>
                    <div className="mt-6 flex items-baseline text-white">
                        <span className="text-5xl font-bold tracking-tighter">
                            {renderPrice(PRICING_PLANS.PRO)}
                        </span>
                        <span className="ml-2 text-slate-500 text-sm font-medium">/month</span>
                    </div>
                </div>

                <Button 
                    onClick={() => handlePurchase(PRICING_PLANS.PRO.id)}
                    disabled={!!loadingPlan}
                    className="w-full mb-8 bg-white text-black hover:bg-slate-200 rounded-xl h-12 font-bold transition-all hover:scale-[1.02]"
                >
                    {loadingPlan === PRICING_PLANS.PRO.id ? <Loader2 className="animate-spin" /> : "Get Pro Power"}
                </Button>

                <ul className="space-y-4">
                    {PRICING_PLANS.PRO.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-slate-300 gap-3">
                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                            </div>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

          </div>

          {/* ── Custom Resume Per Job Post Pitch ────────────────────────────── */}
          <div className="max-w-4xl mx-auto mt-20">
            <div className="relative bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-blue-600/5 border border-indigo-500/20 rounded-3xl p-10 md:p-14 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-violet-500/8 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-indigo-300 mb-5">
                    <Zap size={12} />
                    Why it works
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight">
                    One resume won&apos;t cut it.{" "}
                    <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                      Build a custom one for every job.
                    </span>
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    Recruiters spend 6 seconds scanning your resume. Our AI reads the job description and rewrites your resume to match — every keyword, every skill, every requirement. Each generation is a brand new, tailored resume built specifically for that role.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      Unique per job post
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      ATS keyword matched
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      Ready in 30 seconds
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="relative w-44 h-56 bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={14} className="text-indigo-400" />
                      <div className="h-2 w-16 bg-indigo-400/30 rounded" />
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="h-1.5 w-full bg-white/10 rounded" />
                      <div className="h-1.5 w-4/5 bg-white/10 rounded" />
                      <div className="h-1.5 w-full bg-indigo-400/20 rounded" />
                      <div className="h-1.5 w-3/4 bg-white/10 rounded" />
                    </div>
                    <div className="h-1.5 w-12 bg-white/5 rounded mb-2" />
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-white/10 rounded" />
                      <div className="h-1.5 w-5/6 bg-white/10 rounded" />
                    </div>
                    {/* Match badge */}
                    <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg">
                      94% match
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-8 pt-6 border-t border-white/5 text-center">
                <Link href="/signup">
                  <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/25 border border-indigo-500/30 transition-all duration-300 hover:scale-[1.02]">
                    Start building custom resumes
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              </div>
            </div>
          </div>

      </div>
      {status !== "authenticated" && <PublicFooter />}
    </div>
  );
}
