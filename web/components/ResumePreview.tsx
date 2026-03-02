import React from "react";
import { Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";
import { filterResumeDataForTemplate } from "@/lib/templates";

interface ResumePreviewProps {
  data: any;
  templateId: string;
}

// ── Normalize field names ─────────────────────────────────────────────────────
// Mirrors the Python service normalization so preview === PDF output.
function normalizeEducation(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  return list.map((edu) => ({
    institution: edu.institution || edu.school || edu.name || "",
    degree: buildDegree(edu),
    score: edu.score || edu.grade || edu.gpa || "",
    startDate: edu.startDate || "",
    endDate: edu.endDate || edu.graduationDate || "",
    coursework: edu.coursework || "",
  }));
}

function buildDegree(edu: any): string {
  const degree = edu.degree || "";
  const field = edu.fieldOfStudy || "";
  if (degree && field && !degree.toLowerCase().includes(field.toLowerCase())) {
    return `${degree} in ${field}`;
  }
  return degree || field;
}

function normalizeExperience(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  return list.map((exp) => {
    let bullets: string[] = exp.bullets || [];
    if (!bullets.length) {
      const desc = exp.description || exp.summary || "";
      if (desc) {
        bullets = desc
          .split(/[\n•\-\*]+/)
          .map((b: string) => b.trim().replace(/^[•\-\*\s]+/, ""))
          .filter(Boolean);
      }
    }
    return {
      company: exp.company || "",
      role: exp.role || exp.position || exp.title || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "Present",
      location: exp.location || "",
      bullets,
    };
  });
}

function normalizeProjects(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  return list.map((proj) => {
    let tech = proj.techStack || proj.technologies || proj.tech || [];
    if (typeof tech === "string") tech = tech.split(",").map((t: string) => t.trim()).filter(Boolean);
    return {
      title: proj.title || proj.name || "",
      role: proj.role || "",
      link: proj.link || proj.url || "",
      techStack: tech,
      description: proj.description || "",
    };
  });
}

function normalizeSkills(skills: any): string[] {
  if (Array.isArray(skills)) return skills.map(String);
  if (typeof skills === "string") return skills.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function normalizeData(data: any): any {
  if (!data) return data;
  return {
    ...data,
    education:  normalizeEducation(data.education),
    experience: normalizeExperience(data.experience),
    projects:   normalizeProjects(data.projects),
    skills:     normalizeSkills(data.skills),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export const ResumePreview: React.FC<ResumePreviewProps> = ({ data, templateId }) => {
  if (!data) return null;

  const normalized = normalizeData(data);
  // Filter to only sections this template renders — preview matches PDF exactly
  const filtered = filterResumeDataForTemplate(normalized, templateId);

  // Render logic based on templateId
  switch (templateId) {
    case "business":
    case "business2":
    case "impact": // Premium
      return <BusinessTemplate data={filtered} />;
    case "beginner":
    case "beginner2":
    case "minimal": // Premium
      return <BeginnerTemplate data={filtered} />;
    case "experienced":
      return <ExperiencedTemplate data={filtered} />;
    case "modern": // Premium
    case "tech": // Premium
      return <ModernTemplate data={filtered} />;
    case "creative":
      return <CreativeTemplate data={filtered} />;
    case "classic":
    case "classic2":
    case "classic3":
    case "compact": // Premium
    case "elegant": // Premium
    case "ivy":     // Premium
    case "scholar": // Premium
    default:
      return <ClassicTemplate data={filtered} />;
  }
};

/* --- TEMPLATES --- */

// 1. CLASSIC (Serif, Centered, Traditional)
const ClassicTemplate = ({ data }: { data: any }) => (
  <div className="bg-white text-black p-10 font-serif h-full min-h-[800px] border border-gray-200 shadow-sm">
    <div className="text-center border-b-2 border-black pb-4 mb-6">
      <h1 className="text-4xl font-bold uppercase tracking-widest">{data.personalInfo?.fullName}</h1>
      {data.personalInfo?.headline && <p className="text-lg italic mt-1">{data.personalInfo.headline}</p>}
      
      <div className="flex justify-center gap-3 text-sm mt-3 flex-wrap text-gray-700">
        {data.personalInfo?.email && <span>{data.personalInfo.email}</span>}
        {data.personalInfo?.phone && <span>| {data.personalInfo.phone}</span>}
        {data.personalInfo?.location && <span>| {data.personalInfo.location}</span>}
        {data.personalInfo?.linkedin && <span>| <a href={data.personalInfo.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a></span>}
        {data.personalInfo?.github && <span>| <a href={data.personalInfo.github} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a></span>}
        {data.personalInfo?.portfolio && <span>| <a href={data.personalInfo.portfolio} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a></span>}
      </div>
    </div>

    {data.personalInfo?.summary && (
      <div className="mb-6">
        <h3 className="text-sm font-bold border-b border-black mb-3 uppercase tracking-wider">Summary</h3>
        <p className="text-sm leading-relaxed text-justify">{data.personalInfo.summary}</p>
      </div>
    )}

    {data.experience?.length > 0 && (
      <div className="mb-6">
        <h3 className="text-sm font-bold border-b border-black mb-3 uppercase tracking-wider">Experience</h3>
        {data.experience.map((exp: any, i: number) => (
          <div key={i} className="mb-4">
            <div className="flex justify-between font-bold text-sm">
              <span>{exp.company}</span>
              <span>{exp.startDate} - {exp.endDate}</span>
            </div>
            <div className="text-sm italic mb-1">{exp.role}</div>
            <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
              {exp.bullets?.map((b: string, j: number) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}

    {data.projects?.length > 0 && (
        <div className="mb-6">
            <h3 className="text-sm font-bold border-b border-black mb-3 uppercase tracking-wider">Projects</h3>
            {data.projects.map((proj: any, i: number) => (
                <div key={i} className="mb-4">
                    <div className="flex justify-between text-sm">
                        <div className="font-bold">
                            {proj.title}
                            {proj.link && (
                                <span className="ml-2 font-normal italic text-blue-800">
                                    <a href={proj.link} target="_blank" rel="noreferrer" className="hover:underline">
                                        [Link]
                                    </a>
                                </span>
                            )}
                        </div>
                        <span className="italic">{proj.role}</span>
                    </div>
                    {proj.techStack && (
                        <div className="text-xs italic text-gray-600 mb-1">
                            Tech: {Array.isArray(proj.techStack) ? proj.techStack.join(", ") : proj.techStack}
                        </div>
                    )}
                    <p className="text-sm">{proj.description}</p>
                </div>
            ))}
        </div>
    )}

    {data.education?.length > 0 && (
      <div className="mb-6">
        <h3 className="text-sm font-bold border-b border-black mb-3 uppercase tracking-wider">Education</h3>
        {data.education.map((edu: any, i: number) => (
          <div key={i} className="mb-2">
            <div className="flex justify-between font-bold text-sm">
              <span>{edu.institution}</span>
              <span>{edu.startDate} - {edu.endDate}</span>
            </div>
            <div className="text-sm">
              {edu.degree} {edu.score && `| ${edu.score}`}
            </div>
            {edu.coursework && <div className="text-xs italic text-gray-600 mt-0.5">Coursework: {edu.coursework}</div>}
          </div>
        ))}
      </div>
    )}

    {data.skills?.length > 0 && (
      <div className="mb-6">
        <h3 className="text-sm font-bold border-b border-black mb-3 uppercase tracking-wider">Skills</h3>
        <p className="text-sm">{Array.isArray(data.skills) ? data.skills.join(" • ") : data.skills}</p>
      </div>
    )}

    {/* New Sections: Achievements, Certifications, Publications */}
    {(data.achievements?.length > 0 || data.certifications?.length > 0 || data.publications?.length > 0) && (
        <div className="mb-6 space-y-4">
            {data.achievements?.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold border-b border-black mb-2 uppercase tracking-wider">Achievements</h3>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                        {data.achievements.map((ach: any, i: number) => (
                            <li key={i}>
                                <span className="font-bold">{ach.title}</span> - {ach.organization} ({ach.dateReceived})
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {data.certifications?.length > 0 && (
                <div>
                     <h3 className="text-sm font-bold border-b border-black mb-2 uppercase tracking-wider">Certifications</h3>
                     <ul className="list-disc pl-5 text-sm space-y-1">
                        {data.certifications.map((cert: any, i: number) => (
                            <li key={i}>
                                <span className="font-bold">{cert.name}</span>, {cert.organization} ({cert.issueDate})
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {data.publications?.length > 0 && (
                <div>
                     <h3 className="text-sm font-bold border-b border-black mb-2 uppercase tracking-wider">Publications</h3>
                     <ul className="list-disc pl-5 text-sm space-y-1">
                        {data.publications.map((pub: any, i: number) => (
                            <li key={i}>
                                <span className="italic">{pub.title}</span> - {pub.journal} ({pub.date})
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )}
  </div>
);

// 2. MODERN (Sans-Serif, Accent Colors, Clean)
const ModernTemplate = ({ data }: { data: any }) => (
  <div className="bg-white text-slate-800 p-10 font-sans h-full min-h-[800px] border border-gray-200 shadow-sm">
    <div className="flex justify-between items-end border-b-4 border-blue-600 pb-4 mb-8">
        <div>
            <h1 className="text-5xl font-extrabold text-blue-900 tracking-tight">{data.personalInfo?.fullName}</h1>
            <p className="text-lg text-blue-600 font-medium mt-1">{data.personalInfo?.headline || data.personalInfo?.location || "Professional"}</p>
        </div>
        <div className="text-right text-sm space-y-1 text-gray-600">
             <div className="flex items-center justify-end gap-2"><Mail size={14}/> {data.personalInfo?.email}</div>
             <div className="flex items-center justify-end gap-2"><Phone size={14}/> {data.personalInfo?.phone}</div>
             {data.personalInfo?.linkedin && <div className="flex items-center justify-end gap-2"><Linkedin size={14}/> <a href={data.personalInfo?.linkedin} className="hover:text-blue-600">LinkedIn</a></div>}
             {data.personalInfo?.github && <div className="flex items-center justify-end gap-2"><Globe size={14}/> <a href={data.personalInfo?.github} className="hover:text-blue-600">GitHub</a></div>}
             {data.personalInfo?.portfolio && <div className="flex items-center justify-end gap-2"><Globe size={14}/> <a href={data.personalInfo?.portfolio} className="hover:text-blue-600">Portfolio</a></div>}
        </div>
    </div>

    <div className="grid grid-cols-1 gap-8">
        {data.personalInfo?.summary && (
            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-blue-600">
                <p className="text-sm leading-relaxed text-slate-700">{data.personalInfo.summary}</p>
            </div>
        )}

        {data.experience?.length > 0 && (
            <div>
                 <h3 className="text-xl font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">Experience</h3>
                 <div className="space-y-6">
                    {data.experience.map((exp: any, i: number) => (
                        <div key={i} className="relative pl-6 border-l-2 border-blue-100">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600"></div>
                            <div className="flex justify-between items-baseline">
                                <h4 className="font-bold text-lg text-slate-900">{exp.role}</h4>
                                <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">{exp.startDate} - {exp.endDate}</span>
                            </div>
                            <div className="text-md font-semibold text-slate-700 mb-2">{exp.company}</div>
                            <ul className="list-disc pl-4 text-sm text-slate-600 space-y-1">
                                {exp.bullets?.map((b: string, j: number) => <li key={j}>{b}</li>)}
                            </ul>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        {data.projects?.length > 0 && (
            <div>
                 <h3 className="text-xl font-bold text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">Projects</h3>
                 <div className="space-y-6">
                    {data.projects.map((proj: any, i: number) => (
                        <div key={i} className="relative pl-6 border-l-2 border-blue-100">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-300"></div>
                            <div className="flex justify-between items-baseline">
                                <h4 className="font-bold text-lg text-slate-900">
                                    {proj.title} 
                                    {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" className="text-sm italic font-normal text-blue-600 ml-2 hover:underline">[Link]</a>}
                                </h4>
                            </div>
                            <div className="text-sm font-semibold text-slate-500 mb-1">{proj.techStack && (Array.isArray(proj.techStack) ? proj.techStack.join(" | ") : proj.techStack)}</div>
                            <p className="text-sm text-slate-600">{proj.description}</p>
                        </div>
                    ))}
                 </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-8">
             {data.education?.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-blue-900 uppercase tracking-widest mb-3">Education</h3>
                    {data.education.map((edu: any, i: number) => (
                        <div key={i} className="mb-4">
                            <div className="font-bold text-slate-900">{edu.institution}</div>
                            <div className="text-sm text-blue-700">{edu.degree}</div>
                            <div className="text-xs text-slate-500">{edu.startDate} - {edu.endDate}</div>
                        </div>
                    ))}
                </div>
             )}
             
             {data.skills?.length > 0 && (
                <div>
                     <h3 className="text-lg font-bold text-blue-900 uppercase tracking-widest mb-3">Skills</h3>
                     <div className="flex flex-wrap gap-2">
                        {(Array.isArray(data.skills) ? data.skills : data.skills.split(',')).map((skill: string, i: number) => (
                            <span key={i} className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-sm">
                                {skill.trim()}
                            </span>
                        ))}
                     </div>
                </div>
             )}
        </div>

        {/* Certs & Achievements Layout */}
        {(data.certifications?.length > 0 || data.achievements?.length > 0) && (
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                 {data.certifications?.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-blue-900 uppercase tracking-widest mb-3">Certifications</h3>
                        <ul className="text-sm text-slate-600 space-y-2">
                            {data.certifications.map((cert: any, i: number) => (
                                <li key={i}>• {cert.name}</li>
                            ))}
                        </ul>
                    </div>
                 )}
                 {data.achievements?.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-blue-900 uppercase tracking-widest mb-3">Achievements</h3>
                        <ul className="text-sm text-slate-600 space-y-2">
                            {data.achievements.map((ach: any, i: number) => (
                                <li key={i}>• {ach.title}</li>
                            ))}
                        </ul>
                    </div>
                 )}
            </div>
        )}
    </div>
  </div>
);

// 3. CREATIVE (Distinctive, Sidebarish)
const CreativeTemplate = ({ data }: { data: any }) => (
    <div className="bg-white text-gray-800 font-sans h-full min-h-[800px] flex shadow-sm">
         {/* Sidebar */}
         <div className="w-1/3 bg-gray-900 text-white p-8 flex flex-col gap-8">
             <div className="text-center">
                 <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold border-4 border-white">
                    {data.personalInfo?.fullName?.[0]}
                 </div>
                 <h1 className="text-2xl font-bold uppercase leading-tight">{data.personalInfo?.fullName}</h1>
                 <p className="text-gray-400 text-sm mt-2">{data.personalInfo?.headline || data.personalInfo?.location}</p>
             </div>

             <div className="space-y-3 text-sm">
                 <div className="flex items-center gap-2"><Mail size={16} className="text-slate-400"/> {data.personalInfo?.email}</div>
                 <div className="flex items-center gap-2"><Phone size={16} className="text-slate-400"/> {data.personalInfo?.phone}</div>
                 {data.personalInfo?.linkedin && <div className="flex items-center gap-2 block truncate"><Linkedin size={16} className="text-slate-400"/>In</div>}
                 {data.personalInfo?.github && <div className="flex items-center gap-2 block truncate"><Globe size={16} className="text-slate-400"/>Git</div>}
             </div>

             {data.skills?.length > 0 && (
                 <div>
                     <h3 className="text-purple-400 font-bold uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">Skills</h3>
                     <div className="flex flex-wrap gap-2">
                        {(Array.isArray(data.skills) ? data.skills : data.skills.split(',')).map((skill: string, i: number) => (
                            <span key={i} className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700">
                                {skill.trim()}
                            </span>
                        ))}
                     </div>
                 </div>
             )}

             {data.education?.length > 0 && (
                 <div>
                     <h3 className="text-purple-400 font-bold uppercase tracking-widest border-b border-gray-700 pb-2 mb-4">Education</h3>
                     {data.education.map((edu: any, i: number) => (
                        <div key={i} className="mb-4">
                            <div className="font-bold text-white">{edu.institution}</div>
                            <div className="text-xs text-gray-400">{edu.degree}</div>
                            <div className="text-xs text-gray-500 italic">{edu.endDate}</div>
                        </div>
                    ))}
                 </div>
             )}
         </div>

         {/* Main Content */}
         <div className="w-2/3 p-10">
             {data.personalInfo?.summary && (
                 <div className="mb-8">
                     <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile</h3>
                     <div className="w-10 h-1 bg-purple-600 mb-4"></div>
                     <p className="text-gray-600 leading-relaxed">{data.personalInfo.summary}</p>
                 </div>
             )}

             {data.experience?.length > 0 && (
                  <div className="mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Experience</h3>
                      <div className="w-10 h-1 bg-purple-600 mb-6"></div>
                      <div className="space-y-8">
                          {data.experience.map((exp: any, i: number) => (
                             <div key={i}>
                                 <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="text-lg font-bold text-gray-800">{exp.company}</h4>
                                    <span className="text-sm font-semibold text-purple-600">{exp.startDate} - {exp.endDate}</span>
                                 </div>
                                 <div className="text-md italic text-gray-500 mb-2">{exp.role}</div>
                                 <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 marker:text-purple-600">
                                     {exp.bullets?.map((b: string, j: number) => <li key={j}>{b}</li>)}
                                 </ul>
                             </div>
                          ))}
                      </div>
                  </div>
             )}

             {data.projects?.length > 0 && (
                  <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Projects</h3>
                      <div className="w-10 h-1 bg-purple-600 mb-6"></div>
                      <div className="space-y-6">
                          {data.projects.map((proj: any, i: number) => (
                             <div key={i}>
                                 <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="text-lg font-bold text-gray-800">
                                        {proj.title}
                                        {proj.link && <a href={proj.link} target="_blank" rel="noreferrer" className="text-sm italic font-normal text-purple-600 ml-2 hover:underline">[Link]</a>}
                                    </h4>
                                 </div>
                                 <p className="text-sm text-gray-600">{proj.description}</p>
                             </div>
                          ))}
                      </div>
                  </div>
             )}
             
             {/* Achievements/Certs block if space */}
         </div>
    </div>
);

// 4. BUSINESS (Professional, Two Column, Crisp)
const BusinessTemplate = ({ data }: { data: any }) => (
    <div className="bg-white text-slate-900 p-10 font-sans h-full min-h-[800px] border border-gray-200 shadow-sm">
        <header className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
             <div>
                 <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-tighter">{data.personalInfo?.fullName}</h1>
                 <p className="text-xl text-slate-500 font-light">{data.personalInfo?.location}</p>
             </div>
             <div className="text-right text-sm font-medium space-y-1 text-slate-600">
                 <p>{data.personalInfo?.email}</p>
                 <p>{data.personalInfo?.phone}</p>
                 <p>{data.personalInfo?.linkedin}</p>
             </div>
        </header>

        <div className="grid grid-cols-3 gap-8">
            {/* Left Col: Main Info */}
            <div className="col-span-2 space-y-8">
                 {data.personalInfo?.summary && (
                     <section>
                         <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Profile</h3>
                         <p className="text-sm leading-relaxed font-medium text-slate-700">{data.personalInfo.summary}</p>
                     </section>
                 )}

                 {data.experience?.length > 0 && (
                     <section>
                         <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Work History</h3>
                         <div className="space-y-6">
                            {data.experience.map((exp: any, i: number) => (
                                <div key={i}>
                                    <h4 className="font-bold text-lg">{exp.company}</h4>
                                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                                        <span className="font-semibold italic">{exp.role}</span>
                                        <span>{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <ul className="text-sm space-y-1 text-slate-600">
                                        {exp.bullets?.map((b: string, j: number) => (
                                            <li key={j} className="flex gap-2">
                                                <span className="text-slate-400">•</span>
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                         </div>
                     </section>
                 )}
            </div>

            {/* Right Col: Education & Skills */}
            <div className="col-span-1 space-y-8 border-l border-slate-100 pl-8">
                 {data.education?.length > 0 && (
                     <section>
                         <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Education</h3>
                         <div className="space-y-4">
                            {data.education.map((edu: any, i: number) => (
                                <div key={i}>
                                    <div className="font-bold text-sm">{edu.institution}</div>
                                    <div className="text-xs text-slate-600 mt-1">{edu.degree}</div>
                                    <div className="text-xs text-slate-400 mt-1">{edu.endDate}</div>
                                    {edu.score && <div className="text-xs font-semibold bg-slate-100 inline-block px-1 rounded mt-1">GPA: {edu.score}</div>}
                                </div>
                            ))}
                         </div>
                     </section>
                 )}

                 {data.skills?.length > 0 && (
                     <section>
                         <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Areas of Expertise</h3>
                         <ul className="text-sm space-y-2 font-medium text-slate-700">
                            {(Array.isArray(data.skills) ? data.skills : data.skills.split(',')).map((skill: string, i: number) => (
                                <li key={i} className="border-b border-slate-50 pb-1">{skill.trim()}</li>
                            ))}
                         </ul>
                     </section>
                 )}
            </div>
        </div>
    </div>
);

// 5. BEGINNER (Simple, single column, very clean)
const BeginnerTemplate = ({ data }: { data: any }) => (
    <div className="bg-white text-black p-12 font-sans h-full min-h-[800px] border border-gray-200 shadow-sm">
        <div className="text-center mb-10">
             <h1 className="text-3xl font-normal lowercase tracking-wide">{data.personalInfo?.fullName}</h1>
             <div className="flex justify-center gap-6 mt-4 text-xs tracking-wider text-gray-500 uppercase">
                 <span>{data.personalInfo?.email}</span>
                 <span>{data.personalInfo?.phone}</span>
                 <span>{data.personalInfo?.location}</span>
             </div>
        </div>

        <div className="max-w-xl mx-auto space-y-10">
             {data.education?.length > 0 && (
                 <section>
                     <h3 className="text-center text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-2 mb-6 text-gray-400">Education</h3>
                     {data.education.map((edu: any, i: number) => (
                        <div key={i} className="text-center mb-4">
                            <div className="font-bold">{edu.institution}</div>
                            <div className="text-sm italic">{edu.degree}</div>
                            <div className="text-xs text-gray-400 mt-1">{edu.startDate} — {edu.endDate}</div>
                        </div>
                     ))}
                 </section>
             )}

             {data.experience?.length > 0 && (
                 <section>
                     <h3 className="text-center text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-2 mb-6 text-gray-400">Experience</h3>
                     {data.experience.map((exp: any, i: number) => (
                        <div key={i} className="mb-8">
                            <div className="text-center mb-2">
                                <span className="font-bold block">{exp.company}</span>
                                <span className="text-xs text-gray-500 uppercase">{exp.role}</span>
                            </div>
                            <ul className="text-sm space-y-2 text-gray-600 text-center">
                                {exp.bullets?.map((b: string, j: number) => (
                                    <li key={j}>{b}</li>
                                ))}
                            </ul>
                        </div>
                     ))}
                 </section>
             )}

            {data.skills?.length > 0 && (
                 <section>
                     <h3 className="text-center text-sm font-bold uppercase tracking-widest border-b border-gray-200 pb-2 mb-6 text-gray-400">Skills</h3>
                     <p className="text-center text-sm leading-7">
                        {(Array.isArray(data.skills) ? data.skills : data.skills.split(',')).map((skill: string, i: number) => (
                           <span key={i} className="mx-2">{skill.trim()}</span>
                        ))}
                     </p>
                 </section>
             )}
        </div>
    </div>
);

// 6. EXPERIENCED (Dense, Sidebar, Info Heavy)
const ExperiencedTemplate = ({ data }: { data: any }) => (
    <div className="bg-slate-50 text-slate-800 font-sans h-full min-h-[800px] border border-gray-200 flex">
         {/* Left Sidebar Info */}
         <div className="w-64 bg-slate-200 p-6 flex flex-col gap-6 text-sm">
             <div>
                <h1 className="text-2xl font-bold text-slate-900 leading-none mb-2">{data.personalInfo?.fullName}</h1>
                <p className="text-slate-600">{data.personalInfo?.email}</p>
                <p className="text-slate-600">{data.personalInfo?.phone}</p>
                <p className="text-slate-600">{data.personalInfo?.location}</p>
             </div>
             
             {data.skills?.length > 0 && (
                 <div>
                     <h3 className="font-bold text-slate-900 mb-2 uppercase text-xs">Skills</h3>
                     <div className="flex flex-col gap-1">
                        {(Array.isArray(data.skills) ? data.skills : data.skills.split(',')).map((skill: string, i: number) => (
                             <span key={i} className="text-slate-700 block border-b border-slate-300 pb-1">{skill.trim()}</span>
                        ))}
                     </div>
                 </div>
             )}

             {data.education?.length > 0 && (
                 <div>
                     <h3 className="font-bold text-slate-900 mb-2 uppercase text-xs">Education</h3>
                     {data.education.map((edu: any, i: number) => (
                        <div key={i} className="mb-3">
                            <div className="font-bold text-slate-800">{edu.institution}</div>
                            <div className="text-xs text-slate-600">{edu.degree}</div>
                            <div className="text-xs text-slate-500">{edu.endDate}</div>
                        </div>
                     ))}
                 </div>
             )}
         </div>

         {/* Main Content */}
         <div className="flex-1 p-8">
             {data.personalInfo?.summary && (
                 <div className="mb-6 bg-white p-4 shadow-sm border border-slate-200">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Professional Summary</h3>
                     <p className="text-sm text-slate-700">{data.personalInfo.summary}</p>
                 </div>
             )}

             {data.experience?.length > 0 && (
                 <div>
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-4">Professional Experience</h3>
                     <div className="space-y-4">
                        {data.experience.map((exp: any, i: number) => (
                            <div key={i} className="bg-white p-6 shadow-sm border border-slate-200 transition-shadow hover:shadow-md">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-bold text-lg text-blue-900">{exp.company}</h4>
                                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{exp.startDate} - {exp.endDate}</span>
                                </div>
                                <div className="text-sm font-medium text-slate-500 mb-3">{exp.role}</div>
                                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                                    {exp.bullets?.map((b: string, j: number) => <li key={j}>{b}</li>)}
                                </ul>
                            </div>
                        ))}
                     </div>
                 </div>
             )}
         </div>
    </div>
);
