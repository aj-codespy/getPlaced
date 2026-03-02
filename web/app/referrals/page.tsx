
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Gift, Users, Loader2, Check, Crown, Share2, ArrowRight } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default function ReferralsPage() {
  const [data, setData] = useState({ code: "", referralCount: 0, creditsEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referrals")
        .then(res => res.json())
        .then(data => {
            if(data.code) setData(data);
        })
        .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = () => {
      navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const progress = (data.referralCount % 2) * 50;
  const friendsToNextReward = 2 - (data.referralCount % 2);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-slate-400" size={28} />
        <span className="text-sm text-slate-500 animate-pulse">Loading referrals...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-slate-200">
      <DashboardHeader />
      
      <div className="container mx-auto px-6 py-10 max-w-4xl">
        
        {/* Hero Banner */}
        <div className="glass-card rounded-3xl overflow-hidden mb-8 relative animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <div className="relative z-10 p-8 md:p-10 text-center">
            <div className="h-16 w-16 mx-auto mb-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Refer 2 Friends, Get 1 <span className="gradient-text">Free Resume</span>
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
                Help your friends land their dream jobs with getPlaced. 
                When 2 friends sign up using your code, you earn 100 Credits instantly.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 stagger-children">
          
          {/* Left: Your Code */}
          <div className="glass-card rounded-2xl p-7 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Crown size={16} className="text-slate-400" /> Your Referral Code
            </h2>
            
            <div className="flex gap-2">
              <div className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl flex items-center justify-center text-xl font-mono font-bold tracking-[0.15em] text-white h-14 select-all">
                  {data.code}
              </div>
              <Button 
                onClick={copyToClipboard} 
                className={`h-14 w-14 p-0 shrink-0 rounded-xl transition-all ${
                  copied 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                }`}
                variant="outline"
              >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
                Share this code with your friends. They should enter it during profile setup.
            </p>
            
            <div className="pt-4 border-t border-white/[0.04]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Share via</h3>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-10 rounded-xl border-white/[0.06] text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] text-sm"
                  onClick={() => window.open(`https://wa.me/?text=Use my code ${data.code} on getPlaced to build the perfect resume!`, '_blank')}
                >
                    WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 h-10 rounded-xl border-white/[0.06] text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] text-sm"
                  onClick={() => window.open(`https://linkedin.com`, '_blank')}
                >
                    LinkedIn
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="glass-card rounded-2xl p-7 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" /> Your Impact
            </h2>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.03] border border-white/[0.05] p-5 rounded-xl text-center group hover:border-white/[0.08] transition-colors">
                    <div className="text-3xl font-black text-white mb-1 tabular-nums">{data.referralCount}</div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Friends Referred</div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] p-5 rounded-xl text-center group hover:border-white/[0.08] transition-colors">
                    <div className="text-3xl font-black text-emerald-400 mb-1 tabular-nums">{data.creditsEarned}</div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Credits Earned</div>
                </div>
            </div>

            {/* Reward Progress */}
            <div className="space-y-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-5">
              <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-300">Next Reward</span>
                  <span className="text-indigo-400 text-xs font-bold">{friendsToNextReward} to go</span>
              </div>
              <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 animate-progress-fill" 
                    style={{ width: `${progress}%` }}
                  />
              </div>
              <p className="text-[11px] text-slate-600">
                  Every 2 referrals unlocks 100 credits. Keep going!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
