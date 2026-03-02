
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
// pdfjs-dist imported dynamically to avoid SSR issues
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface ScoreCategory {
  name: string;
  score: number;
  max: number;
  feedback: string;
}

interface ScoreData {
  totalScore: number;
  grade: string;
  categories: ScoreCategory[];
  summary: string;
}

export default function CheckScorePage() {
    const [scoreData, setScoreData] = useState<ScoreData | null>(null);
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // ── Reconstruct lines using Y-coordinate positions ──────────
                // pdfjs-dist text items each have a 'transform' with [a,b,c,d,tx,ty]
                // where ty = Y position. Group items by Y to form proper lines.
                interface TextItem {
                    str: string;
                    x: number;
                    y: number;
                }
                const items: TextItem[] = [];
                for (const item of textContent.items) {
                    if ('str' in item && item.str.trim()) {
                        const tx = (item as { transform: number[] }).transform?.[4] ?? 0;
                        const ty = (item as { transform: number[] }).transform?.[5] ?? 0;
                        items.push({ str: item.str, x: tx, y: ty });
                    }
                }
                
                if (items.length === 0) continue;
                
                // Smart join: merge text items that are part of the same word
                // (handles LaTeX small-caps where "Experience" becomes ["E", "XPERIENCE"])
                function smartJoinLine(lineItems: TextItem[]): string {
                    lineItems.sort((a, b) => a.x - b.x);
                    if (lineItems.length === 0) return "";
                    if (lineItems.length === 1) return lineItems[0].str;
                    
                    let result = lineItems[0].str;
                    for (let i = 1; i < lineItems.length; i++) {
                        const prev = lineItems[i - 1];
                        const curr = lineItems[i];
                        // Estimate the end position of prev item
                        // Avg char width ≈ 5-7pt for 11pt font. Use a generous threshold.
                        const prevEndX = prev.x + prev.str.length * 5;
                        const gap = curr.x - prevEndX;
                        
                        // If gap is small (< 4pt), items are part of the same word  
                        if (gap < 4) {
                            result += curr.str;
                        } else {
                            result += " " + curr.str;
                        }
                    }
                    
                    // Post-process: collapse single-letter + space + word patterns
                    // e.g., "E XPERIENCE" → "EXPERIENCE", "S KILLS" → "SKILLS"
                    result = result.replace(/\b([A-Z])\s([A-Z]{2,})\b/g, '$1$2');
                    
                    return result;
                }
                
                // Group by Y-coordinate (items within 3pt of each other = same line)
                items.sort((a, b) => b.y - a.y || a.x - b.x); // top to bottom, left to right
                
                const lines: string[] = [];
                let currentLineY = items[0].y;
                let currentLine: TextItem[] = [];
                
                for (const item of items) {
                    if (Math.abs(item.y - currentLineY) > 3) {
                        // New line — flush current
                        lines.push(smartJoinLine(currentLine));
                        currentLine = [];
                        currentLineY = item.y;
                    }
                    currentLine.push(item);
                }
                // Flush last line
                if (currentLine.length > 0) {
                    lines.push(smartJoinLine(currentLine));
                }
                
                fullText += lines.join("\n") + "\n";
            }

            const res = await fetch("/api/resume/check-score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeText: fullText })
            });
            const data = await res.json();
            
            if (data.success) {
                setScoreData(data.scoreData);
            } else {
                alert("Failed to calculate score");
            }

        } catch (e) {
            console.error(e);
            alert("Error reading file.");
        } finally {
            setLoading(false);
        }
    };

    const scoreColor = (score: number) => {
      if (score >= 78) return "text-emerald-400";
      if (score >= 65) return "text-amber-400";
      if (score >= 50) return "text-orange-400";
      return "text-red-400";
    };

    return (
        <div className="min-h-screen relative font-sans text-slate-200">
             <DashboardHeader />
             
             <div className="container mx-auto px-4 max-w-5xl space-y-8 relative z-10 py-12">
                <div className="text-center space-y-4 animate-slide-up">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-2">
                         Resume Score <span className="gradient-text">Checker</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base">
                        Get an instant, rule-based analysis of your resume formatting, keywords, and impact metrics. 
                        Free and unlimited.
                    </p>
                </div>

                {/* Upload Section */}
                {!scoreData && (
                     <div className="max-w-xl mx-auto glass-card rounded-3xl p-12 text-center hover:border-emerald-500/20 transition-all cursor-pointer relative group animate-slide-up delay-200">
                        <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} disabled={loading} />
                        
                        {loading ? (
                            <div className="flex flex-col items-center">
                                <div className="relative">
                                  <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
                                  <div className="absolute inset-0 rounded-full animate-ping opacity-15 bg-emerald-400" />
                                </div>
                                <p className="text-emerald-400 font-medium animate-pulse mt-4">Analyzing parameters...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center pointer-events-none">
                                <div className="h-20 w-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/15 transition-all duration-500 ring-1 ring-emerald-500/10 group-hover:ring-emerald-500/20">
                                    <UploadCloud className="h-10 w-10 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Upload Resume PDF</h3>
                                <p className="text-slate-500 text-sm">Drag & drop or Click to Browse</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Results Section */}
                {scoreData && (
                    <div className="animate-slide-up space-y-8">
                        
                        {/* Summary Cards */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                             {/* Total Score */}
                             <div className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                                 <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 opacity-40"></div>
                                 <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none"></div>
                                 
                                 <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-4">Overall ATS Score</h3>
                                 <div className={`text-7xl font-black mb-1 tracking-tighter drop-shadow-lg ${scoreColor(scoreData.totalScore)}`}>
                                     {scoreData.totalScore}
                                 </div>
                                 <p className="text-sm text-slate-600 font-medium mb-3">/ 100 points</p>
                                 {scoreData.grade && (
                                     <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                         scoreData.totalScore >= 78 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                         scoreData.totalScore >= 65 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                         'bg-red-500/10 border-red-500/20 text-red-400'
                                     }`}>{scoreData.grade}</span>
                                 )}
                                 {scoreData.totalScore < 75 && (
                                     <p className="text-[11px] text-slate-600 mt-4 max-w-[160px] text-center leading-relaxed">
                                         ✦ Use our AI builder to boost your score
                                     </p>
                                 )}
                             </div>

                             {/* Chart */}
                             <div className="glass-card p-6 rounded-3xl col-span-1 lg:col-span-2 text-xs shadow-xl relative overflow-hidden">
                                 <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-lg"><BarChart3 size={20} className="text-slate-400"/> Parameter Breakdown</h3>
                                 <div className="h-[200px] w-full relative z-10">
                                     <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={scoreData.categories} layout="vertical" margin={{ left: 40, right: 20 }}>
                                            <XAxis type="number" domain={[0, 30]} hide />
                                            <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} />
                                            <Tooltip 
                                                cursor={{fill: 'rgba(255,255,255,0.03)'}} 
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', color: '#f8fafc', borderRadius: '12px', fontSize: '12px' }}
                                                itemStyle={{ color: '#f8fafc' }}
                                            />
                                            <Bar dataKey="score" fill="url(#barGradient)" radius={[0, 8, 8, 0] as [number,number,number,number]} barSize={22} background={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }} />
                                            <defs>
                                              <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#34d399" />
                                                <stop offset="100%" stopColor="#2dd4bf" />
                                              </linearGradient>
                                            </defs>
                                        </BarChart>
                                     </ResponsiveContainer>
                                 </div>
                             </div>
                        </div>

                        {/* Detailed Feedback */}
                        <div className="grid md:grid-cols-2 gap-5 stagger-children">
                            {scoreData.categories.map((cat: ScoreCategory, i: number) => (
                                <div key={i} className="glass-card p-6 rounded-2xl flex items-start gap-5 group">
                                    <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${cat.score === cat.max ? 'bg-white/[0.06] text-slate-400 ring-1 ring-emerald-500/15' : 'bg-white/[0.06] text-slate-400 ring-1 ring-amber-500/15'}`}>
                                        {cat.score === cat.max ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-white text-base group-hover:text-emerald-200 transition-colors">{cat.name}</h4>
                                            <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white/[0.03] text-slate-400 border border-white/[0.05]">{cat.score}/{cat.max}</span>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed">{cat.feedback}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 flex justify-center pb-10">
                            <Button variant="outline" onClick={() => setScoreData(null)} className="glass-card text-white hover:text-emerald-400 h-12 px-8 rounded-full border-white/[0.06] hover:border-emerald-500/20">
                                <UploadCloud className="mr-2 h-4 w-4"/> Check Another Resume
                            </Button>
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
}
