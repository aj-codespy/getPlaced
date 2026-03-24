
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Gift, Users, Loader2, Check, Crown, Share2, Link as LinkIcon, MessageSquare } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default function ReferralsPage() {
  const [data, setData] = useState({ code: "", referralCount: 0, creditsEarned: 0, rewardPerReferral: 50 });
  const [loading, setLoading] = useState(true);
  const [copiedKind, setCopiedKind] = useState<"" | "code" | "link" | "message">("");
  const [customMessage, setCustomMessage] = useState("Hey! I use getPlaced to build ATS-friendly resumes. Join using my referral code.");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const hasNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    fetch("/api/referrals")
        .then(res => res.json())
        .then(data => {
            if(data.code) setData(data);
        })
        .finally(() => setLoading(false));
  }, []);

  const referralLink = data.code ? `${origin}/signup?ref=${encodeURIComponent(data.code)}` : `${origin}/signup`;
  const shareMessage = `${customMessage.trim()}\n\nReferral code: ${data.code}\nSign up link: ${referralLink}`;

  const copyText = async (text: string, kind: "code" | "link" | "message") => {
      await navigator.clipboard.writeText(text);
      setCopiedKind(kind);
      setTimeout(() => setCopiedKind(""), 1800);
  };

  const handleNativeShare = async () => {
      if (!navigator.share) return;
      try {
          await navigator.share({
              title: "Join me on getPlaced",
              text: `${customMessage.trim()}\nReferral code: ${data.code}`,
              url: referralLink,
          });
      } catch {
          // User cancel is expected; no-op.
      }
  };

  const estimatedFriendBonus = data.referralCount * data.rewardPerReferral;

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
              Refer Friends. <span className="gradient-text">Both Earn Credits.</span>
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
                Win-win model: every successful referral gives <span className="text-indigo-300 font-semibold">{data.rewardPerReferral} credits</span> to you and
                <span className="text-indigo-300 font-semibold"> {data.rewardPerReferral} credits</span> to your friend.
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
                onClick={() => copyText(data.code, "code")}
                className={`h-14 w-14 p-0 shrink-0 rounded-xl transition-all ${
                  copiedKind === "code" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                }`}
                variant="outline"
              >
                  {copiedKind === "code" ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Referral Link</label>
              <div className="flex gap-2">
                <div className="flex-1 h-11 px-3 flex items-center rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 truncate select-all">
                  {referralLink}
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyText(referralLink, "link")}
                  className={`h-11 w-11 p-0 rounded-xl ${
                    copiedKind === "link"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "border-white/[0.06] text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06]"
                  }`}
                >
                  {copiedKind === "link" ? <Check size={16} /> : <LinkIcon size={16} />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Custom Share Message</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full min-h-[86px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Write your own invite note..."
              />
              <Button
                variant="outline"
                onClick={() => copyText(shareMessage, "message")}
                className={`h-10 rounded-xl w-full ${
                  copiedKind === "message"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "border-white/[0.06] text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06]"
                }`}
              >
                {copiedKind === "message" ? <Check size={14} className="mr-2" /> : <MessageSquare size={14} className="mr-2" />}
                {copiedKind === "message" ? "Message Copied" : "Copy Full Message"}
              </Button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
                Your friend can sign up from the link or directly enter your code during onboarding.
            </p>
            
            <div className="pt-4 border-t border-white/[0.04]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Share via</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="h-10 rounded-xl border-white/[0.06] text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] text-sm"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank")}
                >
                    WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  className="h-10 rounded-xl border-white/[0.06] text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] text-sm"
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, "_blank")}
                >
                    LinkedIn
                </Button>
                {hasNativeShare && (
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-white/[0.06] text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] text-sm"
                    onClick={handleNativeShare}
                  >
                    <Share2 size={14} className="mr-2" />
                    Share
                  </Button>
                )}
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

            {/* Reward Summary */}
            <div className="space-y-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-5">
              <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-300">Referral Reward</span>
                  <span className="text-indigo-300 text-xs font-bold">+{data.rewardPerReferral} each side</span>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
                Your friends together have received approximately{" "}
                <span className="font-semibold text-emerald-300">{estimatedFriendBonus}</span> bonus credits from your referrals.
              </div>
              <p className="text-[11px] text-slate-600">Credits are applied immediately when referral is accepted.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
