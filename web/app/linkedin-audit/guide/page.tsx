
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Globe, MousePointerClick } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default function LinkedInGuidePage() {
  return (
    <div className="min-h-screen text-slate-200 font-sans">
      <DashboardHeader />

      <div className="max-w-4xl w-full mx-auto px-4 py-10 animate-slide-up">
         <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">How to Export Your LinkedIn Data</h1>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
                To get the most accurate AI audit, we recommend using the text from your &quot;About&quot; and &quot;Experience&quot; sections, or downloading your PDF. Here is the easiest way.
            </p>
         </div>

         <div className="grid md:grid-cols-2 gap-8 stagger-children">
             {/* Option 1: Copy Paste */}
             <div className="glass-card rounded-3xl p-8 relative group">
                 <div className="absolute -top-3 left-8 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 rounded-full text-white font-bold text-xs tracking-wider shadow-lg shadow-indigo-500/20">
                     RECOMMENDED
                 </div>
                 <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 text-indigo-400">
                     <MousePointerClick size={24} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-4">Direct Copy-Paste</h3>
                 <p className="text-slate-500 mb-6 text-sm">The fastest way. Just grab your profile text.</p>
                 
                 <ol className="space-y-4 text-slate-300 text-sm">
                     <StepItem n={1}>Go to your <strong className="text-white">LinkedIn Profile</strong> page.</StepItem>
                     <StepItem n={2}>Scroll to your <strong className="text-white">About</strong> section. Copy the text.</StepItem>
                     <StepItem n={3}>Scroll to <strong className="text-white">Experience</strong>. Copy your most recent roles.</StepItem>
                     <StepItem n={4}>Paste everything into the <strong className="text-white">getPlaced Audit text box</strong>.</StepItem>
                 </ol>
             </div>

             {/* Option 2: PDF Export */}
             <div className="glass-card rounded-3xl p-8 relative group">
                  <div className="absolute -top-3 left-8 bg-white/[0.06] px-4 py-1 rounded-full text-slate-400 font-bold text-xs tracking-wider border border-white/[0.06]">
                     OPTION 2
                 </div>
                 <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 text-indigo-400">
                     <FileText size={24} />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-4">Save to PDF</h3>
                 <p className="text-slate-500 mb-6 text-sm">Download your official LinkedIn resume PDF.</p>
                 
                 <ol className="space-y-4 text-slate-300 text-sm">
                     <StepItem n={1}>Go to your <strong className="text-white">LinkedIn Profile</strong>.</StepItem>
                     <StepItem n={2}>Click the <strong className="text-white">More...</strong> button near your profile picture.</StepItem>
                     <StepItem n={3}>Select <strong className="text-white">Save to PDF</strong>.</StepItem>
                     <StepItem n={4}>Open the PDF, press <strong className="text-white">Ctrl+A (Select All)</strong>, Copy, and Paste into our tool.</StepItem>
                 </ol>
             </div>
         </div>
            
         <div className="mt-12 flex justify-center">
            <Link href="https://www.linkedin.com/in/" target="_blank">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full px-8 h-12 text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]">
                    <Globe className="mr-2 h-4 w-4" /> Go to LinkedIn
                </Button>
            </Link>
         </div>

      </div>
    </div>
  );
}

function StepItem({ n, children }: { n: number, children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
        <span className="h-6 w-6 rounded-full bg-white/[0.06] text-white flex items-center justify-center text-xs font-bold shrink-0">
          {n}
        </span>
        <span>{children}</span>
    </li>
  );
}
