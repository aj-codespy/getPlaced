
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBox, type MessageBoxVariant } from "@/components/ui/message-box";
import { Loader2, CheckCircle2, Trophy, Target, BookOpen, Sparkles, UploadCloud, FileText as FileIcon, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
// pdfjs-dist imported dynamically to avoid SSR issues
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface AuditSection {
  score: number;
  feedback: string;
  suggestion?: string;
  missingKeywords?: string[];
}

interface AuditReport {
  overallScore: number;
  headline: AuditSection;
  about: AuditSection;
  experience: AuditSection;
  skills: AuditSection;
  actionItems: string[];
}

export default function LinkedInAuditPage() {
  const [profileText, setProfileText] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [messageBox, setMessageBox] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: MessageBoxVariant;
  }>({
    open: false,
    title: "",
    message: "",
    variant: "info",
  });

  const showMessage = (title: string, message: string, variant: MessageBoxVariant = "info") => {
      setMessageBox({ open: true, title, message, variant });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type !== 'application/pdf') {
          showMessage("Unsupported File", "Please upload a PDF file.", "warning");
          e.target.value = "";
          return;
      }

      setExtracting(true);
      try {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";

          for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item) => ('str' in item ? item.str : "")).join(" ");
              fullText += pageText + "\n";
          }

          setProfileText(fullText);
      } catch (err) {
          console.error("PDF Extraction Error", err);
          showMessage("Read Failed", "Failed to read PDF. Please copy-paste text instead.", "error");
      } finally {
          setExtracting(false);
          e.target.value = "";
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) {
          e.target.value = "";
          return;
      }

      if (files.length > 2) {
          showMessage("Too Many Images", "You can only upload a maximum of 2 images.", "warning");
          e.target.value = "";
          return;
      }

      const imageFiles = Array.from(files).slice(0, 2).filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length === 0) {
          showMessage("Unsupported Files", "Please upload valid image files.", "warning");
          e.target.value = "";
          return;
      }

      try {
          const encodedImages = await Promise.all(
              imageFiles.map(
                  (file) =>
                      new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                              if (typeof ev.target?.result === "string") {
                                  resolve(ev.target.result);
                              } else {
                                  reject(new Error("Unable to read image"));
                              }
                          };
                          reader.onerror = () => reject(new Error("Unable to read image"));
                          reader.readAsDataURL(file);
                      }),
              ),
          );
          setImages(encodedImages);
      } catch {
          showMessage("Image Read Failed", "Unable to read one or more selected images.", "error");
      } finally {
          e.target.value = "";
      }
  };

  const handleAudit = async () => {
      if((!profileText || profileText.length < 50) && images.length === 0) {
          showMessage("Missing Input", "Please provide either text content or upload screenshots.", "warning");
          return;
      }
      
      setLoading(true);
      try {
          const res = await fetch("/api/linkedin/audit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profileText, images })
          });
          const data = await res.json().catch(() => ({}));
          
          if(!res.ok) throw new Error(data.error);
          
          setReport(data.analysis);
      } catch(e: unknown) {
          showMessage("Audit Failed", e instanceof Error ? e.message : "Unknown error", "error");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen text-slate-200 font-sans">
        <DashboardHeader />

        <div className="container mx-auto px-4 max-w-5xl py-10">
          
          {!report ? (
               <div className="w-full max-w-3xl mx-auto animate-slide-up">
                  <div className="text-center mb-10">
                      <div className="inline-flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-xs mb-4 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                         <Sparkles size={12} /> AI Career Coach
                      </div>
                      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">LinkedIn Profile Audit</h1>
                      <p className="text-slate-400 text-base mb-6">
                          Paste your LinkedIn profile text, upload a PDF, or attach screenshots. <br/>
                          Our AI will score your profile and give you actionable fixes.
                      </p>
                      <Link href="/linkedin-audit/guide">
                          <Button variant="outline" className="rounded-full border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04] text-sm">
                              <BookOpen className="mr-2 h-4 w-4" /> How to get my profile data?
                          </Button>
                      </Link>
                  </div>

                  <div className="glass-card rounded-2xl p-8 space-y-6">
                      
                      <div className="grid md:grid-cols-2 gap-4">
                          {/* PDF Upload Zone */}
                          <div>
                              <input 
                                  type="file" 
                                  id="pdf-upload" 
                                  accept="application/pdf" 
                                  className="hidden" 
                                  onChange={handleFileUpload}
                              />
                              <div 
                                  onClick={() => document.getElementById('pdf-upload')?.click()}
                                  className="h-full border-2 border-dashed border-white/[0.06] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.03] hover:border-indigo-500/30 transition-all group"
                              >
                                  {extracting ? (
                                      <div className="flex flex-col items-center gap-2 text-indigo-400">
                                          <Loader2 className="animate-spin" size={24} />
                                          <span className="text-xs font-medium">Extracting...</span>
                                      </div>
                                  ) : (
                                      <>
                                          <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                              <UploadCloud className="text-slate-400" size={20} />
                                          </div>
                                          <h3 className="text-white text-sm font-medium mb-1">Upload PDF</h3>
                                          <p className="text-slate-600 text-[10px]">Auto-extract text</p>
                                      </>
                                  )}
                              </div>
                          </div>

                          {/* Image Upload Zone */}
                          <div>
                              <input 
                                  type="file" 
                                  id="img-upload" 
                                  accept="image/*" 
                                  multiple
                                  className="hidden" 
                                  onChange={handleImageUpload}
                              />
                              <div 
                                  onClick={() => document.getElementById('img-upload')?.click()}
                                  className="h-full border-2 border-dashed border-white/[0.06] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.03] hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                              >
                                  {images.length > 0 ? (
                                      <div className="flex flex-col items-center gap-2">
                                          <div className="flex -space-x-2">
                                              {images.map((img, i) => (
                                                  <div key={i} className="h-10 w-10 rounded-full border-2 border-[#030712] bg-cover bg-center" style={{ backgroundImage: `url(${img})` }}></div>
                                              ))}
                                          </div>
                                          <span className="text-xs text-emerald-400 font-medium">{images.length} Image(s) Selected</span>
                                          <button onClick={(e) => { e.stopPropagation(); setImages([]); }} className="text-[10px] text-red-400 hover:text-red-300 underline z-10">Clear</button>
                                      </div>
                                  ) : (
                                      <>
                                          <div className="h-10 w-10 bg-pink-500/10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                              <ImageIcon className="text-slate-400" size={20} />
                                          </div>
                                          <h3 className="text-white text-sm font-medium mb-1">Upload Screenshots</h3>
                                          <p className="text-slate-600 text-[10px]">Max 2 images</p>
                                      </>
                                  )}
                              </div>
                          </div>
                      </div>

                      <div className="relative">
                          <div className="absolute top-3 right-3 pointer-events-none">
                               <FileIcon size={16} className="text-slate-700" />
                          </div>
                          <Textarea 
                               className="min-h-[200px] bg-white/[0.02] border-white/[0.06] text-slate-200 text-sm leading-relaxed p-4 focus:ring-indigo-500 font-mono placeholder:text-slate-700"
                               placeholder="Paste your LinkedIn text here... (Ctrl+A on your profile PDF or Webpage text)"
                               value={profileText}
                               onChange={e => setProfileText(e.target.value)}
                          />
                      </div>
                      
                      <div className="flex justify-end">
                          <Button 
                              onClick={handleAudit} 
                              disabled={loading}
                              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-6 text-lg shadow-lg shadow-indigo-500/20 rounded-xl w-full md:w-auto transition-all hover:scale-[1.02]"
                          >
                              {loading ? <><Loader2 className="animate-spin mr-2"/> Analyzing...</> : <><Target className="mr-2"/> Audit My Profile (Pro Feature)</>}
                          </Button>
                      </div>
                      <p className="text-center text-xs text-slate-600 mt-4">
                          Exclusive feature available on Standard and Pro plans.
                      </p>
                  </div>
               </div>
          ) : (
              <div className="w-full max-w-5xl mx-auto animate-slide-up space-y-8">
                  
                  {/* Score Card */}
                  <div className="glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 opacity-40"></div>
                      <div className="relative z-10">
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Overall Profile Strength</div>
                          <div className="text-7xl md:text-8xl font-black text-white mb-4 tracking-tighter flex justify-center items-start gap-2">
                              {report.overallScore} 
                              <span className="text-2xl text-slate-600 font-normal mt-4">/ 100</span>
                          </div>
                          <p className="text-lg text-indigo-400 font-medium">
                              {report.overallScore > 80 ? "Excellent Profile! Just a few tweaks needed." : report.overallScore > 60 ? "Good Start, but needs optimization." : "Needs significant improvement for best results."}
                          </p>
                      </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 stagger-children">
                      <AnalysisCard 
                          title="Headline" 
                          score={report.headline.score} 
                          feedback={report.headline.feedback}
                          suggestion={report.headline.suggestion || ""}
                          icon={<Target className="text-blue-400"/>}
                      />
                      <AnalysisCard 
                          title="About Section" 
                          score={report.about.score} 
                          feedback={report.about.feedback}
                          suggestion={report.about.suggestion || ""}
                          icon={<BookOpen className="text-purple-400"/>}
                      />
                       <AnalysisCard 
                          title="Experience" 
                          score={report.experience.score} 
                          feedback={report.experience.feedback}
                          suggestion={report.experience.suggestion || ""}
                          icon={<Trophy className="text-amber-400"/>}
                      />
                       <div className="glass-card rounded-2xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                               <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                   <Sparkles className="text-slate-400" size={20}/>
                               </div>
                               <h3 className="text-xl font-bold text-white">Skills Gap</h3>
                          </div>
                          <div className="space-y-4">
                              <div className="flex justify-between text-sm mb-1">
                                  <span className="text-slate-400">Optimization Score</span>
                                  <span className="font-bold text-white">{report.skills.score}/100</span>
                              </div>
                              <Progress value={report.skills.score} className="h-2 bg-white/[0.04]" />
                              
                              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl mt-4">
                                  <p className="text-sm text-slate-300 mb-2">{report.skills.feedback}</p>
                                  {(report.skills.missingKeywords?.length ?? 0) > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-3">
                                          {report.skills.missingKeywords?.map((k: string, i: number) => (
                                              <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-lg border border-red-500/15">
                                                  Missing: {k}
                                              </span>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Action Items */}
                  <div className="glass-card rounded-3xl p-8 border-indigo-500/10">
                       <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                           <CheckCircle2 className="text-emerald-400" /> Key Action Items
                       </h3>
                       <div className="space-y-3 stagger-children">
                           {report.actionItems.map((item: string, i: number) => (
                               <div key={i} className="flex gap-4 items-start bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl hover:border-white/[0.06] transition-colors">
                                   <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-lg shadow-indigo-500/20">
                                       {i+1}
                                   </div>
                                   <p className="text-slate-300 text-sm leading-relaxed">{item}</p>
                               </div>
                           ))}
                       </div>
                  </div>
                  
                  <div className="flex justify-center pt-8 pb-20">
                       <Button variant="outline" onClick={() => setReport(null)} className="glass-card text-slate-400 hover:text-white rounded-full h-11 px-8 text-sm">
                           Audit Another Profile
                       </Button>
                  </div>

              </div>
          )}
        </div>
        <MessageBox
          open={messageBox.open}
          title={messageBox.title}
          message={messageBox.message}
          variant={messageBox.variant}
          onClose={() => setMessageBox((prev) => ({ ...prev, open: false }))}
        />
    </div>
  );
}

function AnalysisCard({ title, score, feedback, suggestion, icon }: { title: string; score: number; feedback: string; suggestion: string; icon: React.ReactNode }) {
    return (
        <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/[0.04] rounded-lg flex items-center justify-center">
                        {icon}
                    </div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>
                <div className={`text-xl font-bold ${score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"}`}>
                    {score}/100
                </div>
            </div>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed border-b border-white/[0.04] pb-4">
                {feedback}
            </p>
            <div>
                 <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                     <Sparkles size={12}/> Suggestion
                 </h4>
                 <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-3 text-sm text-indigo-200/80 italic">
                     &quot;{suggestion}&quot;
                 </div>
            </div>
        </div>
    )
}
