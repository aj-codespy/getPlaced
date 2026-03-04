"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Download,
  Loader2,
  ChevronLeft,
  CheckCircle2,
  X,
  Plus,
  Wand2,
  FileText,
  AlertTriangle,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { RESUME_TEMPLATES, getTemplateSections } from "@/lib/templates";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ResumePreview } from "@/components/ResumePreview";

type Phase = "setup" | "generating" | "result";

export default function BuilderPage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("setup");
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [credits, setCredits] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lastTemplate") || "classic";
    }
    return "classic";
  });

  const [jobDescription, setJobDescription] = useState("");
  const [generatedData, setGeneratedData] = useState<Record<string, unknown> | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);

  // Skill chips state (post-generation)
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const previewRef = useRef<HTMLDivElement>(null);

  // ── Missing section detection ──────────────────────────────────────────────
  const SECTION_LABELS: Record<string, string> = {
    summary: "Summary",
    experience: "Experience",
    projects: "Projects",
    education: "Education",
    skills: "Skills",
    achievements: "Achievements",
    certifications: "Certifications",
    publications: "Publications",
  };

  const missingSections = useMemo(() => {
    if (!profile) return [];
    const templateSections = getTemplateSections(selectedTemplate);
    const missing: string[] = [];

    for (const section of templateSections) {
      if (section === "summary") {
        const pi = profile.personalInfo as Record<string, unknown> | undefined;
        if (!pi?.summary || (typeof pi.summary === "string" && pi.summary.trim() === "")) {
          missing.push(section);
        }
      } else {
        const data = profile[section];
        if (!data || (Array.isArray(data) && data.length === 0)) {
          missing.push(section);
        }
      }
    }
    return missing;
  }, [profile, selectedTemplate]);

  // ── Fetch profile & credits on mount ───────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/referrals")
        .then((r) => r.json())
        .catch(() => ({})),
    ])
      .then(([profileData, referralData]) => {
        let p = profileData.profile;
        if (!p) {
          const local = localStorage.getItem("userProfile");
          if (local) p = JSON.parse(local);
        }
        if (!p) {
          alert("Please complete your profile first.");
          router.push("/profile");
          return;
        }
        setProfile(p);
        if (referralData?.totalCredits !== undefined) {
          setCredits(referralData.totalCredits);
        }
        if (referralData?.isPremium > 0 || referralData?.planType === "pro" || referralData?.planType === "premium" || referralData?.planType === "standard") {
          setIsPremium(true);
        }
      })
      .catch(console.error)
      .finally(() => setFetchingProfile(false));
  }, [router]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const pickTemplate = (id: string) => {
    const template = RESUME_TEMPLATES.find((t) => t.id === id);
    if (template?.type === "premium" && !isPremium) {
      if (confirm("This is a Premium template. Upgrade to Pro to use it?")) {
        router.push("/pricing");
      }
      return;
    }
    setSelectedTemplate(id);
    localStorage.setItem("lastTemplate", id);
  };

  const removeSkill = (i: number) =>
    setSkills((prev) => prev.filter((_, idx) => idx !== i));

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setNewSkill("");
  };

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (credits < 100) {
      if (
        confirm(
          "Insufficient credits (100 required). Go to pricing to upgrade?"
        )
      ) {
        router.push("/pricing");
      }
      return;
    }

    if (!profile) return;
    setPhase("generating");

    try {
      const res = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            personalInfo: profile.personalInfo,
            experience: profile.experience,
            education: profile.education,
            skills: profile.skills,
            projects: profile.projects,
            achievements: profile.achievements,
            certifications: profile.certifications,
            publications: profile.publications,
          },
          targetJob: jobDescription,
          templateId: selectedTemplate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const extractedSkills: string[] = Array.isArray(data.data.skills)
          ? data.data.skills
          : typeof data.data.skills === "string"
          ? (data.data.skills as string)
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];

        setGeneratedData(data.data);
        setSkills(extractedSkills);
        setResumeId(data.resumeId || null);
        setPhase("result");

        // Scroll preview into view on mobile
        setTimeout(
          () => previewRef.current?.scrollIntoView({ behavior: "smooth" }),
          100
        );
      } else {
        alert("Generation failed: " + data.error);
        setPhase("setup");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating resume. Please try again.");
      setPhase("setup");
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!generatedData) return;
    setDownloading(true);

    // Merge edited skills back into the data
    const finalData = { ...generatedData, skills };

    try {
      const res = await fetch("/api/resume/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: resumeId || null,
          resumeData: finalData,
          templateId: selectedTemplate,
        }),
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `resume-${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (fetchingProfile) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#030712]">
        <Loader2 className="animate-spin text-slate-400 mr-3" size={28} />
        <span className="text-slate-400 text-sm">Loading your profile…</span>
      </div>
    );
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const isGenerating = phase === "generating";
  const hasResult = phase === "result" && generatedData;
  const canGenerate = !isGenerating && jobDescription.trim().length > 10;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-[#030712] text-slate-200 font-sans overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#030712]/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ChevronLeft size={16} />
          Dashboard
        </Link>

        <div className="flex items-center gap-2">
          {/* Credit pill */}
          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs">
            <span className="text-slate-400">Credits</span>
            <span
              className={`font-bold ${
                credits < 100 ? "text-red-400 animate-pulse" : "text-emerald-400"
              }`}
            >
              {credits}
            </span>
          </div>

          {hasResult && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-white/5 text-xs h-8"
                onClick={() => {
                  setPhase("setup");
                  setGeneratedData(null);
                }}
              >
                ← Restart
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 px-4 shadow-lg shadow-indigo-500/20 text-xs"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="animate-spin mr-1.5" size={13} />
                ) : (
                  <Download size={13} className="mr-1.5" />
                )}
                Download PDF
              </Button>
            </>
          )}
        </div>
      </header>

      {/* ── Body: two-panel layout ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 border-r border-white/5 overflow-y-auto flex flex-col bg-[#060d1f]">
          
          {/* ── Template Picker ─────────────────────────────────────────── */}
          <div className="p-5 border-b border-white/5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Template
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {RESUME_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pickTemplate(t.id)}
                  disabled={isGenerating || !!hasResult}
                  className={`relative shrink-0 w-[72px] rounded-lg overflow-hidden border-2 transition-all duration-200 group focus:outline-none ${
                    selectedTemplate === t.id
                      ? "border-indigo-500 shadow-lg shadow-indigo-500/30"
                      : "border-white/10 hover:border-white/30"
                  } ${(isGenerating || hasResult) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="aspect-[3/4] bg-white relative">
                    {t.thumbnail ? (
                      <Image
                        src={t.thumbnail}
                        alt={t.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText size={16} className="text-slate-300" />
                      </div>
                    )}
                    {t.type === "premium" && (
                      <div className="absolute top-0.5 right-0.5 bg-amber-400 text-[7px] font-black text-black px-1 rounded leading-4">
                        PRO
                      </div>
                    )}
                    {t.type === "premium" && !isPremium && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                        <Lock size={16} className="text-white/70" />
                      </div>
                    )}
                    {selectedTemplate === t.id && (
                      <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                        <CheckCircle2
                          size={18}
                          className="text-indigo-400 drop-shadow"
                        />
                      </div>
                    )}
                  </div>
                  <div className="bg-[#0f172a] px-1 py-0.5 text-center">
                    <span className="text-[9px] text-slate-400 truncate block">
                      {t.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Missing Sections Warning ─────────────────────────────── */}
          {missingSections.length > 0 && !hasResult && (
            <div className="mx-5 mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-400 mb-1">
                    Missing profile data
                  </p>
                  <p className="text-[10px] text-amber-300/70 leading-relaxed">
                    The <span className="font-medium text-white">{RESUME_TEMPLATES.find(t => t.id === selectedTemplate)?.name}</span> template supports these sections, but your profile is missing:
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {missingSections.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[10px] px-2 py-0.5 rounded-full"
                      >
                        {SECTION_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    You can still generate — these sections will simply be omitted from the resume.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Job Description ─────────────────────────────────────────── */}
          <div className="p-5 flex-1 flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Job Description
              </p>
              <Textarea
                placeholder={`Paste the job description here…\n\nOur AI will tailor your resume to match it perfectly — rewriting bullets, highlighting relevant skills, and optimizing for ATS.`}
                className="min-h-[220px] bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600 focus-visible:border-indigo-500/60 focus-visible:ring-indigo-500/20 text-sm resize-none rounded-xl"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* ── Skills chips (post-generation) ──────────────────────── */}
            {hasResult && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Skills — edit before downloading
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(i)}
                        className="text-indigo-400 hover:text-white transition-colors ml-0.5"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Add a skill…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                  />
                  <button
                    onClick={addSkill}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Generate Button ─────────────────────────────────────── */}
            <div className="mt-auto pt-2">
              {!hasResult ? (
                <Button
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-xl shadow-indigo-500/25 border border-indigo-500/30 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Optimizing with Gemini…
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2" size={16} />
                      Generate Resume
                      <Sparkles className="ml-2 opacity-70" size={14} />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xl shadow-indigo-500/25 border border-indigo-500/30 rounded-xl text-sm"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <Download className="mr-2" size={16} />
                  )}
                  {downloading ? "Preparing PDF…" : "Download PDF"}
                </Button>
              )}

              {!hasResult && (
                <p className="text-center text-[11px] text-slate-600 mt-2">
                  {jobDescription.trim().length < 10
                    ? "Paste a job description above to continue"
                    : "Profile auto-loaded · 100 credits per generation"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Live Preview ───────────────────────────────────── */}
        <div
          ref={previewRef}
          className="hidden lg:flex flex-1 bg-slate-900/50 overflow-y-auto items-start justify-center p-8"
        >
          {isGenerating ? (
            /* ── Generating animation ── */
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-2 border-indigo-500/30 flex items-center justify-center">
                  <Sparkles
                    size={32}
                    className="text-indigo-400 animate-pulse"
                  />
                </div>
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg mb-1">
                  Gemini is crafting your resume
                </p>
                <p className="text-slate-500 text-sm max-w-xs">
                  Rewriting bullets with action verbs, tailoring skills, and
                  optimizing for ATS…
                </p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : hasResult ? (
            /* ── Resume preview ── */
            <div className="animate-in fade-in zoom-in-95 duration-500 w-full max-w-[800px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-slate-400" />
                  <span className="text-emerald-400 text-sm font-medium">
                    Resume generated
                  </span>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5">
                <ResumePreview
                  data={{ ...generatedData, skills }}
                  templateId={selectedTemplate}
                />
              </div>
            </div>
          ) : (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none">
              <div className="h-24 w-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <FileText size={36} className="text-slate-600" />
              </div>
              <div>
                <p className="text-slate-500 font-medium mb-1">
                  Your resume preview will appear here
                </p>
                <p className="text-slate-700 text-sm">
                  Pick a template and paste a job description to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
