
"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PRICING_PLANS } from "@/lib/razorpay/pricing";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
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
        name: "getPlaced Premium",
        description: `Unlock ${planId}`,
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
          name: session.user?.name,
          email: session.user?.email,
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
      <DashboardHeader />

      <div className="container mx-auto px-4 relative z-10 pt-16 pb-20">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white">
                Simple, Transparent <br/>
                <span className="gradient-text">Pricing.</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
               Invest in your career with a plan that fits you. <br/> No hidden subscriptions, just powerful credits.
            </p>
          </div>

          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6 items-start stagger-children">
            
            {/* FREE PLAN */}
            <div className="glass-card rounded-3xl p-8 flex flex-col relative group">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-2">Free Tier</h3>
                    <p className="text-slate-500 text-sm h-10">Essential tools to get you started.</p>
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
            
            {/* STANDARD PLAN */}
            <div className="glass-card rounded-3xl p-8 flex flex-col relative group hover:border-indigo-500/20 transition-all hover:shadow-2xl hover:shadow-indigo-500/5">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-2">{PRICING_PLANS.STANDARD.name}</h3>
                    <p className="text-slate-500 text-sm h-10">Perfect for active job seekers.</p>
                    <div className="mt-6 flex items-baseline text-white">
                        <span className="text-5xl font-bold tracking-tighter">
                            {currency === "INR" ? "₹" + PRICING_PLANS.STANDARD.price.INR : "$" + PRICING_PLANS.STANDARD.price.USD}
                        </span>
                        <span className="ml-2 text-slate-500 text-sm font-medium uppercase tracking-wider">One-time</span>
                    </div>
                </div>

                <Button 
                    onClick={() => handlePurchase(PRICING_PLANS.STANDARD.id)}
                    disabled={!!loadingPlan}
                    className="w-full mb-8 bg-white text-black hover:bg-slate-200 rounded-xl h-12 font-bold transition-all hover:scale-[1.02]"
                >
                    {loadingPlan === PRICING_PLANS.STANDARD.id ? <Loader2 className="animate-spin" /> : "Get Standard"}
                </Button>

                <ul className="space-y-4">
                    {PRICING_PLANS.STANDARD.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-slate-300 gap-3">
                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                            </div>
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            {/* PRO PLAN */}
            <div className="relative rounded-3xl p-8 flex flex-col overflow-hidden bg-gradient-to-b from-indigo-950/50 to-[#0a0f1a] border border-indigo-500/30 shadow-2xl shadow-indigo-500/10 transform md:-translate-y-6 md:hover:-translate-y-7 transition-all duration-300 ring-1 ring-indigo-500/10">
                
                {/* Glow Effect */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                <div className="absolute top-0 right-0 bg-gradient-to-bl from-indigo-600 to-purple-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-bl-xl tracking-widest uppercase shadow-lg z-10">
                    Most Popular
                </div>
                
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        {PRICING_PLANS.PRO.name} <Sparkles className="h-5 w-5 text-amber-400 fill-amber-400" />
                    </h3>
                    <p className="text-indigo-200/60 text-sm h-10">Maximize your hiring potential.</p>
                    <div className="mt-6 flex items-baseline text-white">
                        <span className="text-5xl font-bold tracking-tighter">
                            {currency === "INR" ? "₹" + PRICING_PLANS.PRO.price.INR : "$" + PRICING_PLANS.PRO.price.USD}
                        </span>
                        <span className="ml-2 text-indigo-300/60 text-sm font-medium uppercase tracking-wider">One-time</span>
                    </div>
                </div>

                <Button 
                    onClick={() => handlePurchase(PRICING_PLANS.PRO.id)}
                    disabled={!!loadingPlan}
                    className="w-full mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 rounded-xl h-12 font-bold transition-all hover:scale-[1.02]"
                >
                    {loadingPlan === PRICING_PLANS.PRO.id ? <Loader2 className="animate-spin" /> : "Get Pro Power"}
                </Button>

                <ul className="space-y-4">
                    {PRICING_PLANS.PRO.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-white font-medium gap-3">
                            <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

          </div>
      </div>
    </div>
  );
}
