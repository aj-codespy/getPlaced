
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, ChevronLeft, Save, Loader2, Sparkles, X, Plus, UploadCloud } from "lucide-react";
// pdfjs-dist is imported dynamically in handleResumeParse to avoid SSR issues

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const [profile, setProfile] = useState({
     personalInfo: { fullName: "", email: "", phone: "", location: "", headline: "", linkedin: "", github: "", portfolio: "", summary: "", intent: "" },
     education: [{ institution: "", degree: "", startDate: "", endDate: "", score: "" }],
     experience: [{ company: "", role: "", startDate: "", endDate: "", location: "", description: "", bullets: [""] }],
     projects: [{ title: "", role: "", techStack: "", link: "", description: "" }],
     skills: "", 
     achievements: [{ title: "", organization: "", dateReceived: "" }],
     certifications: [{ name: "", organization: "", issueDate: "" }],
     publications: [{ title: "", journal: "", date: "" }],
     courses: [{ name: "", institution: "", date: "" }]
  });

  const handleResumeParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setParsing(true);
      try {
          // 1. Extract Text locally
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

          // 2. Send to API for intelligent parsing
          const res = await fetch("/api/resume/parse", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resumeText: fullText })
          });
          const data = await res.json();
          
          if(!res.ok) throw new Error(data.error);

          // 3. Merge Data
          const p = data.data;
          setProfile(prev => {
              const newState = { ...prev };
              if(p.personalInfo) newState.personalInfo = { ...prev.personalInfo, ...p.personalInfo };
              if(p.education?.length) newState.education = p.education.map((e: Record<string, string>) => ({
                  institution: e.school || "", 
                  degree: e.degree || "", 
                  startDate: e.startDate || "", 
                  endDate: e.endDate || "", 
                  score: e.grade || ""
              }));
              if(p.experience?.length) newState.experience = p.experience.map((e: Record<string, string>) => ({
                  company: e.company || "", 
                  role: e.position || "", 
                  startDate: e.startDate || "", 
                  endDate: e.endDate || "", 
                  location: e.location || "", 
                  description: e.description || "", 
                  bullets: e.description ? e.description.split('\n') : [""]
              }));
              if(p.projects?.length) newState.projects = p.projects.map((e: Record<string, string>) => ({
                  title: e.name || "", 
                  role: "", 
                  techStack: e.technologies || "", 
                  link: e.link || "", 
                  description: e.description || ""
              }));
              if(p.skills && Array.isArray(p.skills)) newState.skills = p.skills.join(", ");
              if(p.certifications?.length) newState.certifications = p.certifications.map((e: Record<string, string>) => ({
                   name: e.name || "", organization: e.issuer || "", issueDate: e.date || ""
              }));
              
              return newState;
          });
          
          alert("Resume Auto-filled! Please review the details.");

      } catch(e: unknown) {
          console.error(e);
          alert("Failed to parse resume: " + (e instanceof Error ? e.message : "Unknown error"));
      } finally {
          setParsing(false);
      }
  };

  useEffect(() => {
     setLoading(true);
     fetch("/api/profile")
        .then(res => res.json())
        .then(data => {
            if(data.profile) {
                const p = data.profile;
                if(!p.education?.length) p.education = [{ institution: "", degree: "", startDate: "", endDate: "", score: "" }];
                if(!p.experience?.length) p.experience = [{ company: "", role: "", startDate: "", endDate: "", location: "", description: "", bullets: [""] }];
                if(!p.projects?.length) p.projects = [{ title: "", role: "", techStack: "", link: "", description: "" }];
                if(Array.isArray(p.skills)) p.skills = p.skills.join(", ");
                setProfile(prev => ({...prev, ...p}));
            }
        })
        .finally(() => setLoading(false));
  }, []);

  const handleSave = async (silent = false) => {
      setSaving(true);
      try {
          const payload = {
              ...profile,
              skills: typeof profile.skills === 'string' ? profile.skills.split(",").map(s => s.trim()).filter(Boolean) : profile.skills
          };

          const res = await fetch("/api/profile", {
              method: "POST", 
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });
          
          if(!res.ok) throw new Error("Failed to save");
          if (!silent) alert("Progress Saved!");
      } catch (e) {
          console.error(e);
          if (!silent) alert("Error saving profile");
      } finally {
          setSaving(false);
      }
  };

  const handleNext = async () => {
      if(step === 1) {
          if(!profile.personalInfo.fullName || !profile.personalInfo.email || !profile.personalInfo.location) {
              alert("Please fill in all mandatory fields (*)");
              return;
          }

          if(referralCode.trim()) {
              try {
                  const refRes = await fetch("/api/referrals", {
                      method: "POST",
                      headers: { "Content-Type" : "application/json" },
                      body: JSON.stringify({ code: referralCode.trim() })
                  });
                  const refData = await refRes.json();
                  
                  if(!refRes.ok) {
                      alert("Referral Error: " + (refData.error || "Invalid Code"));
                      return; 
                  } else {
                      alert("Referral Applied Successuflly! Welcome!");
                      setReferralCode(""); 
                  }
              } catch {
                  alert("Network Error checking referral code");
                  return;
              }
          }
      }
      
      await handleSave(true);
      
      if (step < 6) {
          setStep(s => s + 1);
          window.scrollTo(0,0);
      } else {
          router.push("/dashboard");
      }
  };

  const updateInfo = (field: string, value: string) => {
      setProfile(prev => ({
          ...prev, 
          personalInfo: { ...prev.personalInfo, [field]: value }
      }));
  };

  const updateArrayItem = (section: keyof typeof profile, index: number, field: string, value: string) => {
      setProfile(prev => {
          const arr = [...(prev[section] as Record<string, unknown>[])];
          arr[index] = { ...arr[index], [field]: value };
          return { ...prev, [section]: arr } as typeof prev;
      });
  };
  
  const addArrayItem = (section: keyof typeof profile, template: Record<string, unknown>) => {
      setProfile(prev => ({
          ...prev,
          [section]: [...(prev[section] as Record<string, unknown>[]), template]
      } as typeof prev));
  };

  const removeArrayItem = (section: keyof typeof profile, index: number) => {
      setProfile(prev => {
          const arr = [...(prev[section] as Record<string, unknown>[])];
          if(arr.length > 1) {
             arr.splice(index, 1);
             return { ...prev, [section]: arr } as typeof prev; 
          }
          return prev; 
      });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-transparent"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="min-h-screen font-sans text-slate-200 py-10 px-4 flex flex-col items-center justify-center">
        
        {/* Floating Steps Indicator */}
        <div className="flex items-center gap-2 mb-8 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md sticky top-4 z-40">
           {[1,2,3,4,5,6].map(i => (
               <div key={i} className={`h-2.5 w-2.5 rounded-full transition-all ${step >= i ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`} />
           ))}
           <span className="text-xs text-slate-400 ml-2">Step {step}/6</span>
        </div>

        <div className="w-full max-w-3xl bg-[#0f172a]/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="bg-white/5 border-b border-white/5 p-6 flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/0"></div>
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {step === 1 && "Personal Information"}
                        {step === 2 && "Summary & Skills"}
                        {step === 3 && "Education"}
                        {step === 4 && "Experience"}
                        {step === 5 && "Projects"}
                        {step === 6 && "Achievements & Extras"}
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Fill in details to build your master profile.</p>
                </div>
                <div className="flex gap-4">
                  <Button variant="ghost" size="icon" onClick={() => handleSave(false)} className="hover:bg-white/10 text-slate-400 hover:text-white" title="Save Progress">
                      {saving ? <Loader2 className="animate-spin h-5 w-5"/> : <Save className="h-5 w-5"/>}
                  </Button>
                </div>
            </div>

            <div className="p-8 min-h-[500px] overflow-y-auto max-h-[70vh]">
                
                 {/* STEP 1: Personal Info */}
                {step === 1 && (
                    <div className="space-y-8 animate-in slide-in-from-right fade-in duration-300">
                         {/* Resume Auto-Fill Section */}
                         <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-xl p-6 mb-8 text-center ring-1 ring-white/5 hover:ring-indigo-500/50 transition-all">
                             <input 
                                 type="file" 
                                 id="resume-upload" 
                                 accept="application/pdf" 
                                 className="hidden" 
                                 onChange={handleResumeParse}
                             />
                             <div 
                                 onClick={() => !parsing && document.getElementById('resume-upload')?.click()}
                                 className={`flex flex-col items-center justify-center gap-2 cursor-pointer ${parsing ? 'opacity-50' : ''}`}
                             >
                                 {parsing ? (
                                    <>
                                       <Loader2 className="animate-spin text-slate-400" size={32} />
                                       <span className="text-sm font-medium text-indigo-300">Analyzing your resume with AI...</span>
                                    </>
                                 ) : (
                                    <>
                                       <div className="h-12 w-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-1 shadow-lg shadow-indigo-500/10">
                                            <UploadCloud className="text-slate-400" size={24} />
                                       </div>
                                       <h3 className="text-white font-bold text-lg">Already have a resume?</h3>
                                       <p className="text-slate-400 text-sm">Upload your PDF and let AI auto-fill your profile instantly.</p>
                                       <Button size="sm" variant="outline" className="mt-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200 pointer-events-none">
                                           Select Resume PDF
                                       </Button>
                                    </>
                                 )}
                             </div>
                         </div>

                         <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name <span className="text-indigo-400">*</span></label>
                                <Input className="bg-white/5 border-white/10 text-white focus:ring-indigo-500" value={profile.personalInfo.fullName} onChange={(e) => updateInfo("fullName", e.target.value)} placeholder="e.g. John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email <span className="text-indigo-400">*</span></label>
                                <Input className="bg-white/5 border-white/10 text-white focus:ring-indigo-500" value={profile.personalInfo.email} onChange={(e) => updateInfo("email", e.target.value)} placeholder="john@example.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</label>
                                <Input className="bg-white/5 border-white/10 text-white focus:ring-indigo-500" value={profile.personalInfo.phone} onChange={(e) => updateInfo("phone", e.target.value)} placeholder="+1 555 000 0000" />
                            </div>
                             <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Location <span className="text-indigo-400">*</span></label>
                                <Input className="bg-white/5 border-white/10 text-white focus:ring-indigo-500" value={profile.personalInfo.location} onChange={(e) => updateInfo("location", e.target.value)} placeholder="City, Country" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Headline/Role</label>
                                <Input className="bg-white/5 border-white/10 text-white focus:ring-indigo-500" value={profile.personalInfo.headline} onChange={(e) => updateInfo("headline", e.target.value)} placeholder="e.g. Senior Software Engineer" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Goal <span className="text-indigo-400">*</span></label>
                                <select 
                                    className="w-full flex h-10 rounded-md border text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-white/5 border-white/10 text-white focus:ring-indigo-500 px-3 py-2"
                                    value={profile.personalInfo.intent || ""}
                                    onChange={(e) => updateInfo("intent", e.target.value)}
                                >
                                    <option value="" disabled className="bg-slate-900 text-slate-400">Select your goal</option>
                                    <option value="job" className="bg-slate-900 text-white">Getting a Job (Industry)</option>
                                    <option value="masters" className="bg-slate-900 text-white">Applying for Higher Studies (Master&apos;s/PhD)</option>
                                </select>
                            </div>
                             <div className="col-span-2 space-y-2 pt-4 border-t border-white/5 mt-4">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2"><Sparkles size={12}/> Referral Code (Optional)</label>
                                <div className="flex gap-2">
                                    <Input 
                                        className="max-w-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-200 placeholder:text-indigo-500/50"
                                        placeholder="Enter Friend's Code"
                                        onChange={(e) => setReferralCode(e.target.value)}
                                        value={referralCode}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 pt-6 border-t border-white/5">
                             <h3 className="font-semibold text-sm text-slate-400">Social Links</h3>
                             <div className="grid md:grid-cols-2 gap-6">
                                <Input className="bg-white/5 border-white/10 text-white" value={profile.personalInfo.linkedin} onChange={(e) => updateInfo("linkedin", e.target.value)} placeholder="LinkedIn URL" />
                                <Input className="bg-white/5 border-white/10 text-white" value={profile.personalInfo.github} onChange={(e) => updateInfo("github", e.target.value)} placeholder="GitHub URL" />
                                <Input className="bg-white/5 border-white/10 text-white" value={profile.personalInfo.portfolio} onChange={(e) => updateInfo("portfolio", e.target.value)} placeholder="Portfolio URL" />
                             </div>
                        </div>
                    </div>
                )}
                
                {/* STEP 2: Summary & Skills */}
                {step === 2 && (
                    <div className="space-y-8 animate-in slide-in-from-right fade-in duration-300">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Professional Summary</label>
                            <Textarea 
                                className="min-h-[150px] bg-white/5 border-white/10 text-white focus:ring-indigo-500"
                                value={profile.personalInfo.summary} 
                                onChange={(e) => updateInfo("summary", e.target.value)} 
                                placeholder="Briefly describe your professional background..." 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Skills <span className="text-indigo-400">*</span></label>
                            <Textarea 
                                className="min-h-[100px] bg-white/5 border-white/10 text-white focus:ring-indigo-500"
                                value={profile.skills} 
                                onChange={(e) => setProfile(p => ({...p, skills: e.target.value}))} 
                                placeholder="React, Python, Project Management..."
                            />
                            <p className="text-xs text-slate-500">Separate multiple skills with commas.</p>
                        </div>
                    </div>
                )}

                {/* Steps 3, 4, 5, 6 - Reuse Generic Logic with Styles */}
                {/* Simplified repetitive code for brevity - applying style to generic structure */}
                {[3,4,5,6].includes(step) && (
                     <div className="space-y-6 animate-in slide-in-from-right fade-in duration-300">
                        {step === 3 && profile.education.map((item, idx) => (
                             <CardWrapper key={idx} onDelete={() => removeArrayItem('education', idx)}>
                                 <div className="grid md:grid-cols-2 gap-4">
                                     <Field label="Institution" value={item.institution} onChange={(v) => updateArrayItem('education', idx, 'institution', v)} req />
                                     <Field label="Degree" value={item.degree} onChange={(v) => updateArrayItem('education', idx, 'degree', v)} req />
                                     <Field label="Start Year" value={item.startDate} onChange={(v) => updateArrayItem('education', idx, 'startDate', v)} />
                                     <Field label="End Year" value={item.endDate} onChange={(v) => updateArrayItem('education', idx, 'endDate', v)} req />
                                     <Field label="Score/GPA" value={item.score} onChange={(v) => updateArrayItem('education', idx, 'score', v)} />
                                 </div>
                             </CardWrapper>
                        ))}
                         {step === 3 && <AddButton onClick={() => addArrayItem('education', { institution: "", degree: "", startDate: "", endDate: "", score: "" })} label="Add Education" />}


                        {step === 4 && profile.experience.map((item, idx) => (
                             <CardWrapper key={idx} onDelete={() => removeArrayItem('experience', idx)}>
                                 <div className="grid md:grid-cols-2 gap-4">
                                     <Field label="Company" value={item.company} onChange={(v) => updateArrayItem('experience', idx, 'company', v)} req className="col-span-2"/>
                                     <Field label="Role" value={item.role} onChange={(v) => updateArrayItem('experience', idx, 'role', v)} req />
                                     <Field label="Location" value={item.location} onChange={(v) => updateArrayItem('experience', idx, 'location', v)} />
                                     <Field label="Start Date" value={item.startDate} onChange={(v) => updateArrayItem('experience', idx, 'startDate', v)} />
                                     <Field label="End Date" value={item.endDate} onChange={(v) => updateArrayItem('experience', idx, 'endDate', v)} />
                                     <div className="col-span-2">
                                         <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Description</label>
                                         <Textarea className="bg-white/5 border-white/10 text-white min-h-[100px]" value={Array.isArray(item.bullets) ? item.bullets.join("\n") : item.description} onChange={(e) => {
                                              const bullets = e.target.value.split("\n");
                                              setProfile(prev => {
                                                  const arr = [...prev.experience];
                                                  arr[idx] = { ...arr[idx], bullets, description: e.target.value };
                                                  return { ...prev, experience: arr };
                                              });
                                         }}/>
                                     </div>
                                 </div>
                             </CardWrapper>
                        ))}
                        {step === 4 && <AddButton onClick={() => addArrayItem('experience', { company: "", role: "", startDate: "", endDate: "", location: "", description: "", bullets: [""] })} label="Add Experience" />}

                        {step === 5 && profile.projects.map((item, idx) => (
                             <CardWrapper key={idx} onDelete={() => removeArrayItem('projects', idx)}>
                                 <div className="grid md:grid-cols-2 gap-4">
                                     <Field label="Title" value={item.title} onChange={(v) => updateArrayItem('projects', idx, 'title', v)} req className="col-span-2" />
                                     <Field label="Role" value={item.role} onChange={(v) => updateArrayItem('projects', idx, 'role', v)} />
                                     <Field label="Tech Stack" value={item.techStack} onChange={(v) => updateArrayItem('projects', idx, 'techStack', v)} />
                                     <Field label="Link" value={item.link} onChange={(v) => updateArrayItem('projects', idx, 'link', v)} className="col-span-2"/>
                                     <div className="col-span-2">
                                         <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Description</label>
                                         <Textarea className="bg-white/5 border-white/10 text-white" value={item.description} onChange={(e) => updateArrayItem('projects', idx, 'description', e.target.value)} />
                                     </div>
                                 </div>
                             </CardWrapper>
                        ))}
                        {step === 5 && <AddButton onClick={() => addArrayItem('projects', { title: "", role: "", techStack: "", link: "", description: "" })} label="Add Project" />}
                        
                        {step === 6 && (
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">Publications</h3>
                                {profile.publications.map((item, idx) => (
                                     <div key={idx} className="flex gap-2 mb-2">
                                         <Input className="bg-white/5 border-white/10 text-white flex-[2]" placeholder="Title" value={item.title} onChange={(e) => updateArrayItem('publications', idx, 'title', e.target.value)} />
                                         <Input className="bg-white/5 border-white/10 text-white flex-1" placeholder="Journal" value={item.journal} onChange={(e) => updateArrayItem('publications', idx, 'journal', e.target.value)} />
                                         <Input className="bg-white/5 border-white/10 text-white w-24" placeholder="Date" value={item.date} onChange={(e) => updateArrayItem('publications', idx, 'date', e.target.value)} />
                                     </div>
                                ))}
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-300" onClick={() => addArrayItem('publications', { title: "", journal: "", date: "" })}>+ Add</Button>

                                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 pt-4">Certifications</h3>
                                {profile.certifications.map((item, idx) => (
                                     <div key={idx} className="flex gap-2 mb-2">
                                         <Input className="bg-white/5 border-white/10 text-white flex-[2]" placeholder="Name" value={item.name} onChange={(e) => updateArrayItem('certifications', idx, 'name', e.target.value)} />
                                         <Input className="bg-white/5 border-white/10 text-white flex-1" placeholder="Org" value={item.organization} onChange={(e) => updateArrayItem('certifications', idx, 'organization', e.target.value)} />
                                         <Input className="bg-white/5 border-white/10 text-white w-24" placeholder="Date" value={item.issueDate} onChange={(e) => updateArrayItem('certifications', idx, 'issueDate', e.target.value)} />
                                     </div>
                                ))}
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-300" onClick={() => addArrayItem('certifications', { name: "", organization: "", issueDate: "" })}>+ Add</Button>

                                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 pt-4">Courses</h3>
                                {profile.courses?.map((item: Record<string, string>, idx) => (
                                     <div key={idx} className="flex gap-2 mb-2">
                                         <Input className="bg-white/5 border-white/10 text-white flex-[2]" placeholder="Course Name" value={item.name} onChange={(e) => updateArrayItem('courses', idx, 'name', e.target.value)} />
                                         <Input className="bg-white/5 border-white/10 text-white flex-1" placeholder="Platform" value={item.institution} onChange={(e) => updateArrayItem('courses', idx, 'institution', e.target.value)} />
                                         <Input className="bg-white/5 border-white/10 text-white w-24" placeholder="Date" value={item.date} onChange={(e) => updateArrayItem('courses', idx, 'date', e.target.value)} />
                                     </div>
                                ))}
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-300" onClick={() => addArrayItem('courses', { name: "", institution: "", date: "" })}>+ Add</Button>
                            </div>
                        )}
                     </div>
                )}

            </div>

            {/* Footer */}
            <div className="bg-white/5 border-t border-white/5 p-6 flex justify-between items-center">
                <Button 
                    variant="ghost" 
                    onClick={() => setStep(s => s - 1)} 
                    disabled={step === 1}
                    className="text-slate-400 hover:text-white hover:bg-white/5"
                >
                    <ChevronLeft className="mr-2 h-4 w-4"/> Previous
                </Button>
                
                <div className="flex gap-4 items-center">
                    <Button 
                        variant="ghost" 
                        onClick={() => router.push("/dashboard")} 
                        className="text-slate-400 hover:text-white hover:bg-white/5"
                    >
                        Skip for now
                    </Button>
                    <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 shadow-lg shadow-indigo-500/25">
                        {step === 6 ? "Finish Profile" : "Next Step"} <ChevronRight className="ml-2 h-4 w-4"/>
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
}

// Helpers components for cleaner JSX
function CardWrapper({ children, onDelete }: { children: React.ReactNode, onDelete: () => void }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative group hover:border-indigo-500/30 transition-all">
            <button onClick={onDelete} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={16} />
            </button>
            {children}
        </div>
    )
}

function Field({ label, value, onChange, req, className }: { label: string; value: string; onChange: (v: string) => void; req?: boolean; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {label} {req && <span className="text-indigo-400">*</span>}
            </label>
            <Input className="bg-white/5 border-white/10 text-white focus:ring-indigo-500" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    )
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <Button variant="outline" onClick={onClick} className="w-full border-dashed border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/5 hover:border-indigo-500/50 h-12">
            <Plus className="mr-2 h-4 w-4" /> {label}
        </Button>
    )
}
