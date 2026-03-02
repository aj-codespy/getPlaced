"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Download, ChevronLeft, Save, Wand2, User, Briefcase, GraduationCap, Code2 } from "lucide-react";
import { ResumePreview } from "@/components/ResumePreview";

export default function ResumeEditor() {
    const params = useParams();
    const router = useRouter();
    const resumeId = params.resumeId as string;

    const [loading, setLoading] = useState(true);
    const [optimizing, setOptimizing] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [resumeData, setResumeData] = useState<Record<string, unknown> | null>(null);
    const [targetJob, setTargetJob] = useState("");

    useEffect(() => {
        if (!resumeId) return;
        const fetchResume = async () => {
            try {
                const res = await fetch(`/api/resume/${resumeId}`);
                if (res.ok) {
                    const data = await res.json();
                    setResumeData(data);
                } else {
                    alert("Could not load resume data");
                }
            } catch (e) {
                console.error("Error loading resume:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchResume();
    }, [resumeId]);

    const handleOptimize = async () => {
        if (!targetJob) { alert("Please enter a Target Job Description first!"); return; }
        setOptimizing(true);
        try {
            const res = await fetch("/api/ai/optimize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeId, jobDescription: targetJob })
            });
            const data = await res.json();
            if (data.success) {
                setResumeData(data.data);
            } else {
                alert("Optimization Failed: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error optimizing resume");
        } finally {
            setOptimizing(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const res = await fetch("/api/resume/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ resumeId })
            });
            if (!res.ok) throw new Error("Download failed");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `resume-${resumeId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            alert("Failed to download. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#030712] gap-3">
            <Loader2 className="animate-spin text-slate-400" size={28} />
            <span className="text-sm text-slate-500 animate-pulse">Loading editor…</span>
        </div>
    );

    const rd = resumeData as Record<string, unknown> | null;
    const personalInfo = (rd?.personalInfo ?? {}) as Record<string, string>;
    const experience = (rd?.experience ?? []) as Array<Record<string, unknown>>;
    const skills = rd?.skills;

    return (
        <div className="flex h-screen flex-col bg-[#030712] text-slate-200 font-sans overflow-hidden">
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <header className="h-14 border-b border-white/5 flex items-center justify-between px-5 bg-[#030712]/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/dashboard")}
                        className="text-slate-400 hover:text-white hover:bg-white/5 h-8 w-8"
                    >
                        <ChevronLeft size={16} />
                    </Button>
                    <div className="border-l border-white/10 pl-3">
                        <h1 className="font-bold text-sm text-white leading-tight">
                            {personalInfo?.fullName || "Untitled Resume"}
                        </h1>
                        <p className="text-[10px] text-slate-600">Editing · Auto-saved</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-white/[0.08] bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg"
                        onClick={() => console.log("Save")}
                    >
                        <Save size={13} className="mr-1.5" /> Save
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 rounded-lg"
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? <Loader2 className="animate-spin mr-1.5" size={13} /> : <Download size={13} className="mr-1.5" />}
                        {downloading ? "Preparing…" : "Download PDF"}
                    </Button>
                </div>
            </header>

            {/* ── Body: Two-Panel Layout ────────────────────────────────────── */}
            <div className="flex-1 overflow-hidden flex">

                {/* ── LEFT PANEL: Editor ────────────────────────────────────── */}
                <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0 border-r border-white/5 overflow-y-auto flex flex-col bg-[#060d1f] scrollbar-premium">

                    {/* AI Optimization Card */}
                    <div className="p-5 border-b border-white/5">
                        <div className="glass-card rounded-xl p-5 border-indigo-500/10 relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
                                <Wand2 size={14} className="text-slate-400" /> AI Optimization
                            </h3>
                            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                                Paste a job description and let Gemini rewrite your resume to match it perfectly.
                            </p>
                            <Textarea
                                placeholder="Paste Job Description (JD) here..."
                                className="bg-white/[0.03] border-white/[0.06] text-slate-200 placeholder:text-slate-700 text-xs h-20 mb-3 resize-none focus:ring-indigo-500 rounded-lg"
                                value={targetJob}
                                onChange={(e) => setTargetJob(e.target.value)}
                            />
                            <Button
                                className="w-full h-9 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 rounded-lg transition-all hover:scale-[1.01]"
                                onClick={handleOptimize}
                                disabled={optimizing || !targetJob}
                            >
                                {optimizing ? <><Loader2 className="animate-spin mr-2" size={13} /> Optimizing…</> : <><Sparkles size={13} className="mr-2" /> Magic Optimize</>}
                            </Button>
                        </div>
                    </div>

                    {/* Tabs Editor */}
                    <div className="p-5 flex-1">
                        <Tabs defaultValue="experience" className="w-full">
                            <TabsList className="w-full mb-5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 h-auto">
                                <TabsTrigger value="personal" className="flex-1 text-[11px] data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-slate-500 rounded-lg py-2 gap-1.5">
                                    <User size={12} /> Personal
                                </TabsTrigger>
                                <TabsTrigger value="experience" className="flex-1 text-[11px] data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-slate-500 rounded-lg py-2 gap-1.5">
                                    <Briefcase size={12} /> Experience
                                </TabsTrigger>
                                <TabsTrigger value="education" className="flex-1 text-[11px] data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-slate-500 rounded-lg py-2 gap-1.5">
                                    <GraduationCap size={12} /> Education
                                </TabsTrigger>
                                <TabsTrigger value="skills" className="flex-1 text-[11px] data-[state=active]:bg-white/[0.08] data-[state=active]:text-white text-slate-500 rounded-lg py-2 gap-1.5">
                                    <Code2 size={12} /> Skills
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="experience" className="space-y-3 animate-in fade-in duration-200">
                                {experience?.map((exp, i: number) => (
                                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-indigo-500/20 transition-colors group">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-semibold text-sm text-white group-hover:text-indigo-200 transition-colors">{exp.role as string}</span>
                                            <span className="text-[10px] text-slate-600 bg-white/[0.03] px-2 py-0.5 rounded-full">{exp.company as string}</span>
                                        </div>
                                        <Textarea
                                            value={Array.isArray(exp.bullets) ? (exp.bullets as string[]).join("\n") : exp.description as string}
                                            className="text-xs min-h-[100px] bg-white/[0.02] border-white/[0.05] text-slate-300 focus:ring-indigo-500 resize-none rounded-lg"
                                            onChange={(e) => {
                                                const newExp = [...experience];
                                                newExp[i] = { ...newExp[i], bullets: e.target.value.split("\n") };
                                                setResumeData({ ...resumeData, experience: newExp } as Record<string, unknown>);
                                            }}
                                        />
                                    </div>
                                ))}
                                {experience?.length === 0 && (
                                    <div className="text-center py-12 text-slate-600 text-sm">No experience entries found.</div>
                                )}
                            </TabsContent>

                            <TabsContent value="personal" className="animate-in fade-in duration-200">
                                <div className="space-y-4">
                                    <EditorField label="Full Name" value={personalInfo?.fullName || ""} onChange={(v) => setResumeData({ ...resumeData, personalInfo: { ...personalInfo, fullName: v } } as Record<string, unknown>)} />
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Summary</label>
                                        <Textarea
                                            value={personalInfo?.summary || ""}
                                            onChange={(e) => setResumeData({ ...resumeData, personalInfo: { ...personalInfo, summary: e.target.value } } as Record<string, unknown>)}
                                            placeholder="Professional summary..."
                                            className="h-32 bg-white/[0.03] border-white/[0.06] text-slate-200 text-xs focus:ring-indigo-500 resize-none rounded-lg"
                                        />
                                    </div>
                                    <EditorField label="Email" value={personalInfo?.email || ""} onChange={(v) => setResumeData({ ...resumeData, personalInfo: { ...personalInfo, email: v } } as Record<string, unknown>)} />
                                    <EditorField label="Phone" value={personalInfo?.phone || ""} onChange={(v) => setResumeData({ ...resumeData, personalInfo: { ...personalInfo, phone: v } } as Record<string, unknown>)} />
                                    <EditorField label="Location" value={personalInfo?.location || ""} onChange={(v) => setResumeData({ ...resumeData, personalInfo: { ...personalInfo, location: v } } as Record<string, unknown>)} />
                                </div>
                            </TabsContent>

                            <TabsContent value="education" className="animate-in fade-in duration-200">
                                <div className="text-center py-12 text-slate-600 text-sm">
                                    Education editing coming soon. Edit before generation in your Profile.
                                </div>
                            </TabsContent>

                            <TabsContent value="skills" className="animate-in fade-in duration-200">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Skills (comma-separated)</label>
                                    <Textarea
                                        value={Array.isArray(skills) ? (skills as string[]).join(", ") : (skills as string) || ""}
                                        onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value.split(",").map((s: string) => s.trim()) } as Record<string, unknown>)}
                                        className="h-40 bg-white/[0.03] border-white/[0.06] text-slate-200 text-xs focus:ring-indigo-500 resize-none rounded-lg"
                                        placeholder="Java, Python, React, Node.js..."
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* ── RIGHT PANEL: Live Preview ─────────────────────────────── */}
                <div className="hidden lg:flex flex-1 bg-slate-900/30 overflow-y-auto items-start justify-center p-8">
                    {resumeData ? (
                        <div className="w-full max-w-[800px] animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Live Preview</span>
                            </div>
                            <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5">
                                <ResumePreview data={resumeData} templateId={(rd?.templateId as string) || "classic"} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none">
                            <div className="h-20 w-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                <Briefcase size={32} className="text-slate-700" />
                            </div>
                            <p className="text-slate-600 text-sm">No resume data loaded</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function EditorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</label>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={label}
                className="bg-white/[0.03] border-white/[0.06] text-slate-200 text-xs h-10 focus:ring-indigo-500 rounded-lg"
            />
        </div>
    );
}
