"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"; 
import { Loader2, Plus, Save, User, Briefcase, GraduationCap, Code, Trophy, Award, BookOpen, Trash2, Check, Shield, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  country: string;
  headline: string;
  photoUrl: string;
  linkedin: string;
  github: string;
  portfolio: string;
  twitter: string;
  otherLink: string;
  yearsOfExperience: string;
}

interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  score: string;
  coursework: string;
}

interface Experience {
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrentRole: boolean;
  description: string;
}

interface Project {
  title: string;
  role: string;
  techStack: string;
  link: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface Achievement {
  title: string;
  organization: string;
  dateReceived: string;
  description: string;
}

interface Certification {
  name: string;
  organization: string;
  issueDate: string;
  expirationDate: string;
  credentialUrl: string;
}

interface Publication {
  title: string;
  journal: string;
  date: string;
  link: string;
  description: string;
}

interface Skills {
  technical: string;
  tools: string;
  soft: string;
}

interface UserProfile {
  isLocked: boolean;
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skills;
  achievements: Achievement[];
  certifications: Certification[];
  publications: Publication[];
}

const INITIAL_STATE: UserProfile = {
  isLocked: false,
  personalInfo: { 
    fullName: "", email: "", phone: "", location: "", country: "", headline: "", photoUrl: "",
    linkedin: "", github: "", portfolio: "", twitter: "", otherLink: "", yearsOfExperience: ""
  },
  education: [{ institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", score: "", coursework: "" }],
  experience: [{ jobTitle: "", company: "", location: "", startDate: "", endDate: "", isCurrentRole: false, description: "" }],
  projects: [{ title: "", role: "", techStack: "", link: "", description: "", startDate: "", endDate: "" }],
  skills: { technical: "", tools: "", soft: "" },
  achievements: [{ title: "", organization: "", dateReceived: "", description: "" }],
  certifications: [{ name: "", organization: "", issueDate: "", expirationDate: "", credentialUrl: "" }],
  publications: [{ title: "", journal: "", date: "", link: "", description: "" }]
};

const DRAFT_KEY = "profileDraft";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(INITIAL_STATE);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialLoadDone = useRef(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // ── Auto-save draft to localStorage on every change (debounced 1s) ──────
  const saveDraft = useCallback((data: UserProfile) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch { /* localStorage full — ignore silently */ }
  }, []);

  useEffect(() => {
    // Don't auto-save during initial load
    if (!initialLoadDone.current) return;

    setHasUnsavedChanges(true);

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveDraft(formData);
    }, 1000); // 1 second debounce

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [formData, saveDraft]);

  const dataFetchedRef = useRef(false);

  // ── Warn before leaving with unsaved changes ──────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && !dataFetchedRef.current) {
        dataFetchedRef.current = true;
        fetch("/api/profile")
          .then(res => res.json())
          .then(data => {
              let profile = data.profile;
              
              // Check for local draft (user may have unsaved work)
              const draft = localStorage.getItem(DRAFT_KEY);
              const savedProfile = localStorage.getItem("userProfile");
              
              // Priority: 1. Unsaved Draft, 2. Database Profile, 3. Saved Local Profile
              if (draft) {
                  try { profile = JSON.parse(draft); } catch { /* ignore */ }
              } else if (!profile && savedProfile) {
                  try { profile = JSON.parse(savedProfile); } catch { /* ignore */ }
              }

              if (profile) {
                   const formattedSkills = {
                       technical: Array.isArray(profile.skills?.technical) ? profile.skills.technical.join(", ") : (profile.skills?.technical || ""),
                       tools: Array.isArray(profile.skills?.tools) ? profile.skills.tools.join(", ") : (profile.skills?.tools || ""),
                       soft: Array.isArray(profile.skills?.soft) ? profile.skills.soft.join(", ") : (profile.skills?.soft || ""),
                   };
                   
                   const formattedEducation = profile.education?.map((e: Education) => ({
                       ...e, coursework: Array.isArray(e.coursework) ? e.coursework.join(", ") : e.coursework
                   })) || INITIAL_STATE.education;

                   const formattedProjects = profile.projects?.map((p: Project) => ({
                       ...p, techStack: Array.isArray(p.techStack) ? p.techStack.join(", ") : p.techStack
                   })) || INITIAL_STATE.projects;

                   setFormData({
                       ...INITIAL_STATE,
                       ...profile,
                       skills: formattedSkills,
                       education: formattedEducation,
                       projects: formattedProjects,
                       experience: profile.experience?.length ? profile.experience : INITIAL_STATE.experience,
                       achievements: profile.achievements?.length ? profile.achievements : INITIAL_STATE.achievements,
                       certifications: profile.certifications?.length ? profile.certifications : INITIAL_STATE.certifications,
                       publications: profile.publications?.length ? profile.publications : INITIAL_STATE.publications,
                   });
              } else {
                   setFormData(prev => ({
                       ...prev,
                       personalInfo: { ...prev.personalInfo, email: session?.user?.email || "", fullName: session?.user?.name || "" }
                   }));
              }
              // Mark initial load as done AFTER setting form data
              setTimeout(() => { initialLoadDone.current = true; }, 100);
              setLoading(false);
          })
          .catch(err => {
              console.error(err);
              setLoading(false);
              dataFetchedRef.current = false;
          });
    }
  }, [status, session?.user?.name, session?.user?.email, router]);

  const handleSave = async () => {
      setSaving(true);
      setSaved(false);
      try {
          const payload = {
              ...formData,
              skills: {
                  technical: formData.skills.technical.split(",").map(s => s.trim()).filter(Boolean),
                  tools: formData.skills.tools.split(",").map(s => s.trim()).filter(Boolean),
                  soft: formData.skills.soft.split(",").map(s => s.trim()).filter(Boolean),
              },
              education: formData.education.map(e => ({
                  ...e, coursework: (e.coursework || "").split(",").map(s => s.trim()).filter(Boolean)
              })),
              projects: formData.projects.map(p => ({
                  ...p, techStack: (p.techStack || "").split(",").map(s => s.trim()).filter(Boolean)
              }))
          };
          
          localStorage.setItem("userProfile", JSON.stringify(payload));
          
          const res = await fetch("/api/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
            // Clear draft — server now has the latest data
            localStorage.removeItem(DRAFT_KEY);
            setHasUnsavedChanges(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          } else {
              console.warn("API Failed, used Local Storage");
              setHasUnsavedChanges(false);
              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
          }
      } catch (e) {
          console.error(e);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
      } finally {
          setSaving(false);
      }
  };

  const updateReq = (section: keyof UserProfile, index: number | null, field: string, value: string | boolean) => {
      if (section === "personalInfo") {
           setFormData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
      } else if (section === "skills") {
           setFormData(prev => ({ ...prev, skills: { ...prev.skills, [field]: value } }));
      } else if (index !== null && Array.isArray(formData[section])) {
           setFormData(prev => {
                const sectionData = prev[section] as unknown as Array<Record<string, unknown>>;
                const newArr = [...sectionData];
                newArr[index] = { ...newArr[index], [field]: value };
                return { ...prev, [section]: newArr } as unknown as UserProfile;
           });
      }
  };

  const addItem = (section: keyof UserProfile, template: object) => {
       if (Array.isArray(formData[section])) {
           setFormData(prev => {
               const sectionData = prev[section] as Array<object>;
               return { ...prev, [section]: [...sectionData, template] };
           });
       }
  };

  const removeItem = (section: keyof UserProfile, index: number) => {
       if (Array.isArray(formData[section])) {
           setFormData(prev => {
               const sectionData = prev[section] as Array<object>;
               return { ...prev, [section]: sectionData.filter((_, i) => i !== index) };
           });
       }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-slate-400" size={28} />
        <span className="text-sm text-slate-500 animate-pulse">Loading profile...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-slate-200">
      <DashboardHeader />
      
      <div className="max-w-5xl mx-auto px-6 py-8 pb-32 space-y-6">
            
            {/* Sticky Profile Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card p-5 rounded-2xl sticky top-[65px] z-40 animate-slide-up">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                    {formData.personalInfo.fullName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Your Profile</h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        {formData.isLocked ? (
                          <span className="flex items-center gap-1 text-amber-400/80">
                            <Shield size={11} /> Verified & Locked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400/80">
                            <Sparkles size={11} /> Editable
                          </span>
                        )}
                        <span className="text-slate-700">•</span>
                        {hasUnsavedChanges ? (
                          <span className="text-amber-400/80 animate-pulse">Unsaved changes (draft saved)</span>
                        ) : (
                          <span>All changes saved</span>
                        )}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className={`h-10 px-6 rounded-xl font-medium transition-all text-sm ${
                    saved 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30" 
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20"
                  }`}
                >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    {saved ? "Saved!" : "Save Changes"}
                </Button>
            </div>

            {/* 1. Personal Info */}
            <Section icon={<User size={18}/>} title="Personal Information" description="Identity details. Locked after first resume generation.">
                <div className="grid md:grid-cols-2 gap-5">
                    <Field label="Full Name" required value={formData.personalInfo.fullName} disabled={formData.isLocked} onChange={(v: string) => updateReq("personalInfo", null, "fullName", v)} />
                    <Field label="Email" required value={formData.personalInfo.email} disabled={formData.isLocked} onChange={(v: string) => updateReq("personalInfo", null, "email", v)} />
                    <Field label="Phone" required value={formData.personalInfo.phone} disabled={formData.isLocked} onChange={(v: string) => updateReq("personalInfo", null, "phone", v)} />
                    <Field label="Headline" placeholder="e.g. Aspiring Data Scientist" value={formData.personalInfo.headline} onChange={(v: string) => updateReq("personalInfo", null, "headline", v)} />
                    <Field label="City/Location" required value={formData.personalInfo.location} onChange={(v: string) => updateReq("personalInfo", null, "location", v)} />
                    <Field label="Country" required value={formData.personalInfo.country} onChange={(v: string) => updateReq("personalInfo", null, "country", v)} />
                    <Field label="Years of Experience" placeholder="e.g. 2 or 0 (for freshers)" value={formData.personalInfo.yearsOfExperience} onChange={(v: string) => updateReq("personalInfo", null, "yearsOfExperience", v)} />
                </div>
                <div className="grid md:grid-cols-3 gap-5 mt-5 pt-5 border-t border-white/[0.04]">
                    <Field label="LinkedIn URL" value={formData.personalInfo.linkedin} onChange={(v: string) => updateReq("personalInfo", null, "linkedin", v)} />
                    <Field label="GitHub URL" value={formData.personalInfo.github} onChange={(v: string) => updateReq("personalInfo", null, "github", v)} />
                    <Field label="Portfolio URL" value={formData.personalInfo.portfolio} onChange={(v: string) => updateReq("personalInfo", null, "portfolio", v)} />
                </div>
            </Section>

            {/* 2. Education */}
            <Section icon={<GraduationCap size={18}/>} title="Education" description="Degrees and qualifications.">
                {formData.education.map((edu, i) => (
                    <div key={i} className="mb-5 p-5 bg-white/[0.02] border border-white/[0.04] rounded-xl relative group hover:border-white/[0.08] transition-colors">
                        <RemoveButton onClick={() => removeItem("education", i)} />
                        <div className="grid md:grid-cols-2 gap-4">
                            <Field label="Institution Name" required value={edu.institution} onChange={(v: string) => updateReq("education", i, "institution", v)} />
                            <Field label="Degree" placeholder="e.g. B.Tech Computer Engineering" required value={edu.degree} onChange={(v: string) => updateReq("education", i, "degree", v)} />
                            <Field label="Field of Study" value={edu.fieldOfStudy} onChange={(v: string) => updateReq("education", i, "fieldOfStudy", v)} />
                            <Field label="CGPA / Score" value={edu.score} onChange={(v: string) => updateReq("education", i, "score", v)} />
                            <Field label="Start Date" type="month" value={edu.startDate} onChange={(v: string) => updateReq("education", i, "startDate", v)} />
                            <Field label="End Date (or Expected)" type="month" value={edu.endDate} onChange={(v: string) => updateReq("education", i, "endDate", v)} />
                            <div className="md:col-span-2">
                                <Field label="Coursework" placeholder="Comma separated: DSA, OS, CN..." value={edu.coursework} onChange={(v: string) => updateReq("education", i, "coursework", v)} />
                            </div>
                        </div>
                    </div>
                ))}
                <AddButton onClick={() => addItem("education", INITIAL_STATE.education[0])} label="Add Education" />
            </Section>

            {/* 3. Experience */}
            <Section icon={<Briefcase size={18}/>} title="Work Experience" description="Internships and full-time roles.">
                {formData.experience.map((exp, i) => (
                    <div key={i} className="mb-5 p-5 bg-white/[0.02] border border-white/[0.04] rounded-xl relative group hover:border-white/[0.08] transition-colors">
                        <RemoveButton onClick={() => removeItem("experience", i)} />
                        <div className="grid md:grid-cols-2 gap-4 mb-3">
                            <Field label="Job Title" required value={exp.jobTitle} onChange={(v: string) => updateReq("experience", i, "jobTitle", v)} />
                            <Field label="Company" required value={exp.company} onChange={(v: string) => updateReq("experience", i, "company", v)} />
                            <Field label="Location" value={exp.location} onChange={(v: string) => updateReq("experience", i, "location", v)} />
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-300">
                                    <Switch checked={exp.isCurrentRole} onCheckedChange={c => updateReq("experience", i, "isCurrentRole", c)} />
                                    I currently work here
                                </label>
                            </div>
                            <Field label="Start Date" type="month" value={exp.startDate} onChange={(v: string) => updateReq("experience", i, "startDate", v)} />
                            {!exp.isCurrentRole && <Field label="End Date" type="month" value={exp.endDate} onChange={(v: string) => updateReq("experience", i, "endDate", v)} />}
                        </div>
                        <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5 block">Description</label>
                        <Textarea className="bg-white/[0.03] border-white/[0.06] text-white focus:ring-indigo-500 placeholder:text-slate-600" rows={4} value={exp.description} onChange={e => updateReq("experience", i, "description", e.target.value)} placeholder="• Led development of..." />
                    </div>
                ))}
                <AddButton onClick={() => addItem("experience", INITIAL_STATE.experience[0])} label="Add Experience" />
            </Section>

            {/* 4. Projects */}
            <Section icon={<Code size={18}/>} title="Projects" description="Notable academic or personal projects.">
                {formData.projects.map((proj, i) => (
                    <div key={i} className="mb-5 p-5 bg-white/[0.02] border border-white/[0.04] rounded-xl relative group hover:border-white/[0.08] transition-colors">
                        <RemoveButton onClick={() => removeItem("projects", i)} />
                        <div className="grid md:grid-cols-2 gap-4 mb-3">
                            <Field label="Project Title" required value={proj.title} onChange={(v: string) => updateReq("projects", i, "title", v)} />
                            <Field label="Role / Affiliation" value={proj.role} onChange={(v: string) => updateReq("projects", i, "role", v)} />
                            <div className="md:col-span-2">
                                <Field label="Tech Stack" placeholder="React, Node.js, MongoDB..." value={proj.techStack} onChange={(v: string) => updateReq("projects", i, "techStack", v)} />
                            </div>
                            <Field label="Project Link" placeholder="github.com/..." value={proj.link} onChange={(v: string) => updateReq("projects", i, "link", v)} />
                        </div>
                        <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5 block">Description</label>
                        <Textarea className="bg-white/[0.03] border-white/[0.06] text-white focus:ring-indigo-500 placeholder:text-slate-600" rows={3} value={proj.description} onChange={e => updateReq("projects", i, "description", e.target.value)} />
                    </div>
                ))}
                <AddButton onClick={() => addItem("projects", INITIAL_STATE.projects[0])} label="Add Project" />
            </Section>

            {/* 5. Skills (Split) */}
            <Section icon={<Award size={18}/>} title="Skills" description="Categorized technical competencies.">
                <div className="space-y-4">
                    <Field label="Technical Skills (Hard Skills)" placeholder="Java, Python, C++..." value={formData.skills.technical} onChange={(v: string) => updateReq("skills", null, "technical", v)} />
                    <Field label="Tools / Platforms" placeholder="VS Code, Docker, AWS, Git..." value={formData.skills.tools} onChange={(v: string) => updateReq("skills", null, "tools", v)} />
                    <Field label="Soft Skills" placeholder="Leadership, Communication..." value={formData.skills.soft} onChange={(v: string) => updateReq("skills", null, "soft", v)} />
                </div>
            </Section>

            {/* 6. Achievements */}
            <Section icon={<Trophy size={18}/>} title="Achievements & Awards" description="Hackathons, competitions, scholarships.">
               {formData.achievements.map((ach, i) => (
                   <div key={i} className="mb-4 p-5 bg-white/[0.02] border border-white/[0.04] rounded-xl relative group hover:border-white/[0.08] transition-colors">
                       <RemoveButton onClick={() => removeItem("achievements", i)} />
                       <div className="grid md:grid-cols-2 gap-4">
                           <Field label="Title" required value={ach.title} onChange={(v: string) => updateReq("achievements", i, "title", v)} />
                           <Field label="Issuer / Organization" value={ach.organization} onChange={(v: string) => updateReq("achievements", i, "organization", v)} />
                           <Field label="Date Received" type="month" value={ach.dateReceived} onChange={(v: string) => updateReq("achievements", i, "dateReceived", v)} />
                       </div>
                   </div>
               ))}
               <AddButton onClick={() => addItem("achievements", INITIAL_STATE.achievements[0])} label="Add Achievement" />
            </Section>
            
            {/* 7. Certifications */}
            <Section icon={<BookOpen size={18}/>} title="Certifications" description="Professional certifications and licenses.">
               {formData.certifications.map((cert, i) => (
                   <div key={i} className="mb-4 p-5 bg-white/[0.02] border border-white/[0.04] rounded-xl relative group hover:border-white/[0.08] transition-colors">
                       <RemoveButton onClick={() => removeItem("certifications", i)} />
                       <div className="grid md:grid-cols-2 gap-4">
                           <Field label="Certification Name" required value={cert.name} onChange={(v: string) => updateReq("certifications", i, "name", v)} />
                           <Field label="Issuing Organization" value={cert.organization} onChange={(v: string) => updateReq("certifications", i, "organization", v)} />
                           <Field label="Issue Date" type="month" value={cert.issueDate} onChange={(v: string) => updateReq("certifications", i, "issueDate", v)} />
                           <Field label="Credential URL" value={cert.credentialUrl} onChange={(v: string) => updateReq("certifications", i, "credentialUrl", v)} />
                       </div>
                   </div>
               ))}
               <AddButton onClick={() => addItem("certifications", INITIAL_STATE.certifications[0])} label="Add Certification" />
            </Section>

        </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Reusable Section / Field Components (Dark Theme)
   ═══════════════════════════════════════════════ */

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

function Section({ icon, title, description, children }: SectionProps) {
    return (
        <div className="glass-card rounded-2xl overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-white/[0.04] flex items-center gap-3">
                <div className="p-2 bg-white/[0.06] text-slate-400 rounded-lg">{icon}</div>
                <div>
                    <h2 className="text-base font-bold text-white">{title}</h2>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
            </div>
            <div className="p-5">
                {children}
            </div>
        </div>
    )
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}

function Field({ label, value, onChange, placeholder, type = "text", required, disabled }: FieldProps) {
    return (
        <div>
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5 block">
                {label} {required && <span className="text-indigo-400">*</span>}
            </label>
            <Input 
                type={type} 
                value={value || ""} 
                onChange={e => onChange(e.target.value)} 
                placeholder={placeholder} 
                disabled={disabled}
                className={`bg-white/[0.03] border-white/[0.06] text-white focus:ring-indigo-500 placeholder:text-slate-600 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-white/[0.1] transition-colors"}`}
            />
        </div>
    )
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <Button variant="outline" onClick={onClick} className="w-full border-dashed border-white/[0.08] bg-transparent text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 h-11 transition-all">
            <Plus className="mr-2 h-4 w-4"/> {label}
        </Button>
    )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick} className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 rounded-lg hover:bg-red-500/10">
            <Trash2 size={16} />
        </button>
    )
}
