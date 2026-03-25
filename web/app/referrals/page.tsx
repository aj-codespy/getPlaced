
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Copy, Gift, Users, Loader2, Check, Crown, Share2, Link as LinkIcon, MessageSquare, Sparkles, Trophy, Target } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";

const CREDITS_PER_RESUME = 100;

export default function ReferralsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState({ code: "", referralCount: 0, creditsEarned: 0, rewardPerReferral: 50, totalCredits: 0 });
  const [loading, setLoading] = useState(true);
  const [copiedKind, setCopiedKind] = useState<"" | "code" | "link" | "message" | "whatsapp" | "linkedin">("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const hasNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const firstName = session?.user?.name?.split(" ")[0] || "Your friend";

  useEffect(() => {
    fetch("/api/referrals")
        .then(res => res.json())
        .then(data => {
            if(data.code) setData(data);
        })
        .finally(() => setLoading(false));
  }, []);

  const referralLink = data.code ? `${origin}/signup?ref=${encodeURIComponent(data.code)}` : `${origin}/signup`;

  // Personalized share message with clear value prop
  const personalMessage = `Hey! 👋 I've been using getPlaced to create ATS-optimized resumes and it's been a game-changer for my job search.

If you sign up with my referral link, we BOTH get 50 credits — that means just 2 referrals = 1 free AI-generated resume! 🎯

🔗 Sign up here: ${referralLink}
📝 Or use my code: ${data.code}

The AI tailors your resume to each job description in seconds. Definitely worth trying!

— ${firstName}`;

  const whatsAppMessage = `Hey! 👋 I use *getPlaced* to build ATS-friendly resumes with AI.

Sign up with my link and we *both* get 50 credits — 2 referrals = 1 free resume! 🎯

Sign up → ${referralLink}
Code: *${data.code}*`;

  const copyText = async (text: string, kind: "code" | "link" | "message" | "whatsapp" | "linkedin") => {
      await navigator.clipboard.writeText(text);
      setCopiedKind(kind);
      setTimeout(() => setCopiedKind(""), 1800);
  };

  const handleNativeShare = async () => {
      if (!navigator.share) return;
      try {
          await navigator.share({
              title: "Join me on getPlaced — we both earn free credits!",
              text: `Join me on getPlaced! Sign up with my code ${data.code} and we BOTH get 50 free credits.`,
              url: referralLink,
          });
      } catch {
          // User cancel
      }
  };

  // Progress calculations
  const referralsForNextResume = 2;
  const currentProgress = data.referralCount % referralsForNextResume;
  const resumesEarned = Math.floor(data.referralCount / referralsForNextResume);
  const progressPercent = (currentProgress / referralsForNextResume) * 100;
  const referralsNeeded = referralsForNextResume - currentProgress;

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
            <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
                Every successful referral gives <span className="text-indigo-300 font-semibold">{data.rewardPerReferral} credits</span> to you and
                <span className="text-indigo-300 font-semibold"> {data.rewardPerReferral} credits</span> to your friend.
                That means <span className="text-emerald-300 font-bold">2 referrals = 1 free AI resume generation!</span>
            </p>
          </div>
        </div>

        {/* Progress Card — "Next Free Resume" tracker */}
        <div className="glass-card rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
              <Target size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Progress to Next Free Resume</h2>
              <p className="text-xs text-slate-500">
                {currentProgress === 0 && data.referralCount === 0 
                  ? "Refer 2 friends to unlock your first free resume"
                  : referralsNeeded > 0
                    ? `${referralsNeeded} more referral${referralsNeeded > 1 ? "s" : ""} needed`
                    : "You've earned a free resume!"
                }
              </p>
            </div>
            {resumesEarned > 0 && (
              <div className="ml-auto flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                <Trophy size={12} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">{resumesEarned} free resume{resumesEarned > 1 ? "s" : ""} earned</span>
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="relative h-3 rounded-full bg-white/[0.05] border border-white/[0.06] overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(progressPercent, data.referralCount > 0 ? 5 : 0)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-600">
            <span>0 referrals</span>
            <span className="text-emerald-400/60 font-semibold">2 referrals = 1 resume ({CREDITS_PER_RESUME} credits)</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 stagger-children">
          
          {/* Left: Your Code + Personalized Message */}
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

            {/* Pre-built shareable message */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your Personalized Message</label>
                <Sparkles size={12} className="text-indigo-400" />
              </div>
              <div className="w-full min-h-[120px] rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {personalMessage}
              </div>
              <Button
                variant="outline"
                onClick={() => copyText(personalMessage, "message")}
                className={`h-10 rounded-xl w-full ${
                  copiedKind === "message"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "border-white/[0.06] text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06]"
                }`}
              >
                {copiedKind === "message" ? <Check size={14} className="mr-2" /> : <MessageSquare size={14} className="mr-2" />}
                {copiedKind === "message" ? "Message Copied!" : "Copy Full Message"}
              </Button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
                Share this message on WhatsApp, LinkedIn, or anywhere — your friend signs up, you both get rewarded instantly.
            </p>
            
            <div className="pt-4 border-t border-white/[0.04]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Quick Share</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="h-10 rounded-xl border-white/[0.06] text-slate-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] text-sm"
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`, "_blank")}
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

          {/* Right: Stats + How It Works */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-7 space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-400" /> Your Impact
              </h2>

              <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/[0.03] border border-white/[0.05] p-4 rounded-xl text-center group hover:border-white/[0.08] transition-colors">
                      <div className="text-2xl font-black text-white mb-0.5 tabular-nums">{data.referralCount}</div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Referred</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.05] p-4 rounded-xl text-center group hover:border-white/[0.08] transition-colors">
                      <div className="text-2xl font-black text-emerald-400 mb-0.5 tabular-nums">{data.creditsEarned}</div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Earned</div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.05] p-4 rounded-xl text-center group hover:border-white/[0.08] transition-colors">
                      <div className="text-2xl font-black text-indigo-400 mb-0.5 tabular-nums">{resumesEarned}</div>
                      <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Free Resumes</div>
                  </div>
              </div>

              {/* Reward Summary */}
              <div className="space-y-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-5">
                <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-300">Per Referral</span>
                    <span className="text-indigo-300 text-xs font-bold">+{data.rewardPerReferral} credits each side</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-300">Resume Cost</span>
                    <span className="text-amber-300 text-xs font-bold">{CREDITS_PER_RESUME} credits</span>
                </div>
                <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300 font-medium text-center">
                  2 referrals × {data.rewardPerReferral} credits = {CREDITS_PER_RESUME} credits = 1 free resume 🎉
                </div>
              </div>
            </div>

            {/* How It Works mini-card */}
            <div className="glass-card rounded-2xl p-7">
              <h3 className="text-base font-bold text-white mb-4">How It Works</h3>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Share your link or code", desc: "Send the personalized message to friends" },
                  { step: "2", title: "Friend signs up", desc: "They create an account using your referral" },
                  { step: "3", title: "Both earn credits", desc: `You each get ${data.rewardPerReferral} credits instantly` },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
