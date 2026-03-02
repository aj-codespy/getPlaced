import os
from dotenv import load_dotenv
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

# Ensure we load the .env from the web directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "web", ".env"))

class ResumeState(TypedDict):
    profile: dict
    target_role: str
    template_sections: list
    
    # Outputs
    summary: str
    experience: list
    projects: list
    skills: list

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.25,
        max_output_tokens=4096,   # Increased: longer, richer content for 450+ word resumes
        api_key=os.environ.get("GEMINI_API_KEY")
    )

class SummaryOutput(BaseModel):
    summary: str

class ExperienceEntry(BaseModel):
    company: str
    role: str
    startDate: str
    endDate: str
    location: Optional[str] = None
    bullets: List[str]

class ExperienceOutputList(BaseModel):
    experience: List[ExperienceEntry]

class ProjectEntry(BaseModel):
    title: str
    role: Optional[str] = None
    link: Optional[str] = None
    techStack: List[str] = []
    description: str
    bullets: List[str] = []

class ProjectOutputList(BaseModel):
    projects: List[ProjectEntry]

class SkillsOutput(BaseModel):
    skills: List[str]

# ── Mandatory action verbs the LLM must use ───────────────────────────────────
ACTION_VERBS = [
    "Led", "Developed", "Created", "Managed", "Designed", "Implemented", "Optimized",
    "Achieved", "Improved", "Increased", "Launched", "Integrated", "Collaborated",
    "Engineered", "Architected", "Analyzed", "Built", "Delivered", "Deployed",
    "Automated", "Streamlined", "Accelerated", "Reduced", "Generated",
    "Spearheaded", "Coordinated", "Mentored", "Scaled", "Migrated",
    "Refactored", "Established", "Transformed", "Executed", "Facilitated",
    "Authored", "Contributed", "Shipped", "Drove", "Pioneered"
]

# ── Helper: build a concise snapshot of the candidate's real background ────────
def _candidate_snapshot(profile: dict) -> str:
    """Build a compact textual snapshot of the candidate's REAL background."""
    parts = []
    pi = profile.get("personalInfo", {})
    if pi.get("headline"):
        parts.append(f"Headline: {pi['headline']}")
    if pi.get("yearsOfExperience"):
        parts.append(f"Years of Experience: {pi['yearsOfExperience']}")
    skills = profile.get("skills", [])
    if skills:
        parts.append(f"Verified Skills: {', '.join(skills[:20]) if isinstance(skills, list) else skills}")
    edu = profile.get("education", [])
    if edu:
        edu_strs = []
        for e in edu[:3]:
            if isinstance(e, dict):
                edu_strs.append(f"{e.get('degree', '')} @ {e.get('institution', e.get('school', ''))}")
        if edu_strs:
            parts.append(f"Education: {'; '.join(edu_strs)}")
    return "\n".join(parts) if parts else "No additional background info available."


async def optimize_summary(state: ResumeState):
    if "summary" not in state.get("template_sections", []):
        return {"summary": state["profile"].get("personalInfo", {}).get("summary", "")}
    
    pi = state["profile"].get("personalInfo", {})
    years_of_exp = pi.get("yearsOfExperience", "")
    headline = pi.get("headline", "")
    current_summary = pi.get("summary", "")
    experience = state["profile"].get("experience", [])
    skills = state["profile"].get("skills", [])

    llm = get_llm().with_structured_output(SummaryOutput)
    prompt = f"""You are an expert ATS Resume Writer. Write a professional summary of EXACTLY 3-4 sentences (60-80 words) for this candidate.

CANDIDATE PROFILE (YOUR ONLY SOURCE):
- Headline: "{headline}"
- Years of Experience: "{years_of_exp}"
- Current Summary: "{current_summary}"
- Experience: {experience}
- Skills: {skills}

TARGET ROLE: "{state['target_role']}"

MANDATORY REQUIREMENTS:
1. MUST be exactly 3-4 complete sentences, each ending with a period.
2. MUST be 60-80 words total — this is critical for ATS scoring and resume length.
3. MUST start with a strong descriptor (e.g., "Results-driven", "Detail-oriented", "Innovative").
4. MUST mention at least 3 specific technical skills from the candidate's actual skill set.
5. MUST include at least TWO quantifiable elements (e.g., "2+ years", "5+ projects", "1000+ users").
6. MUST include at least 2 ATS keywords: scalable, performance, architecture, data, analytics, agile, end-to-end, full-stack.
7. Write in THIRD PERSON without the candidate's name.
8. Use only information from the candidate's data — do NOT invent.
9. If candidate is a fresher, frame as: "Motivated [field] graduate with strong foundation in [skills]."

GOOD EXAMPLE: "Results-driven software engineer with 2+ years of experience in building scalable web applications using React, Node.js, and cloud technologies. Delivered 5+ production-grade projects with focus on performance optimization and clean architecture. Proficient in agile methodologies and end-to-end development, from system design to deployment. Passionate about leveraging modern frameworks to solve complex business problems."

Return JSON with 'summary'.
"""
    try:
        res = await llm.ainvoke(prompt)
        return {"summary": res.summary}
    except Exception as e:
        print("Summary gen error:", e)
        # Generate a basic summary as fallback rather than returning empty
        fallback = current_summary or f"Motivated professional with expertise in {', '.join(skills[:3]) if skills else 'relevant technical skills'}. Seeking to leverage technical abilities and project experience in a challenging role."
        return {"summary": fallback}


async def optimize_experience(state: ResumeState):
    if "experience" not in state.get("template_sections", []) or not state["profile"].get("experience"):
        return {"experience": state["profile"].get("experience", [])}

    snapshot = _candidate_snapshot(state["profile"])
    verb_list = ", ".join(ACTION_VERBS[:20])
    
    llm = get_llm().with_structured_output(ExperienceOutputList)
    prompt = f"""You are an expert ATS Resume Writer. Rewrite the bullet points for ALL experience entries to be ATS-optimized, metrics-rich, and impactful.

CANDIDATE'S VERIFIED BACKGROUND:
{snapshot}

TARGET ROLE: "{state['target_role']}"

INPUT EXPERIENCE: {state['profile']['experience']}

MANDATORY REQUIREMENTS FOR EVERY BULLET:
1. PRESERVE EXACTLY: company, role, startDate, endDate, location. Copy character-for-character.
2. Generate EXACTLY 4 bullet points per experience entry — no fewer, no more.
3. EVERY bullet MUST start with a DIFFERENT strong action verb from this list: {verb_list}
   - NEVER start with "Responsible for", "Worked on", "Helped with", or "Assisted in"
   - NEVER repeat the same verb across bullets within one entry
4. EVERY bullet MUST be 15-20 words long. Each bullet MUST fit on ONE line — do NOT exceed 20 words.
5. At least 2 out of 4 bullets MUST contain a quantifiable metric (X%, X+, $X, X users).
6. Include ATS keywords naturally: api, cloud, agile, scalable, performance, data, end-to-end, etc.
7. Pattern: [Action Verb] + [What you did] + [Technology] + [Impact/Result]
8. Do NOT fabricate experiences or technologies not in the candidate's profile.

EXAMPLE OUTPUT FORMAT (notice: each is 15-20 words, fits ONE line):
"Developed 3 RESTful APIs using Node.js and Express, serving 500+ daily active users."
"Optimized database queries by 40%, reducing response time from 800ms to 480ms."
"Led agile sprints with cross-functional team of 5, delivering milestones ahead of schedule."
"Automated CI/CD pipeline with Docker, reducing deployment time by 60% across 3 environments."

Return JSON with 'experience' array with EXACTLY the same number of entries as input.
"""
    try:
        res = await llm.ainvoke(prompt)
        entries = []
        for x in res.experience:
            d = x.dict()
            # Enforce exactly 4 bullets — pad if needed
            bullets = d.get("bullets", [])
            while len(bullets) < 4:
                bullets.append(f"Contributed to project development using modern technologies and best practices.")
            d["bullets"] = bullets[:4]
            entries.append(d)
        return {"experience": entries}
    except Exception as e:
        print("Experience gen error:", e)
        return {"experience": state["profile"]["experience"]}


async def optimize_projects(state: ResumeState):
    if "projects" not in state.get("template_sections", []) or not state["profile"].get("projects"):
        return {"projects": state["profile"].get("projects", [])}

    snapshot = _candidate_snapshot(state["profile"])
    verb_list = ", ".join(ACTION_VERBS[:20])
    
    # Always generate 4 bullets per project for maximum word count and ATS scoring
    has_experience = bool(state["profile"].get("experience"))
    bullets_per_project = 4
    
    llm = get_llm().with_structured_output(ProjectOutputList)
    prompt = f"""You are an expert ATS Resume Writer. For each project, generate a polished description AND exactly {bullets_per_project} bullet points that maximize ATS score.

{"NOTE: This candidate has NO work experience. Projects are their PRIMARY section. Generate rich, detailed, impactful bullets." if not has_experience else ""}

CANDIDATE'S VERIFIED BACKGROUND:
{snapshot}

TARGET ROLE: "{state['target_role']}"

INPUT PROJECTS: {state['profile']['projects']}

MANDATORY REQUIREMENTS:
1. PRESERVE EXACTLY: title, role, link, techStack — copy character-for-character. Do NOT add or remove.
2. Return EXACTLY the same number of projects as the input.
3. 'description': Rewrite as 1 sentence (15-25 words). Mention the core tech stack and project goal.
4. 'bullets': Generate EXACTLY {bullets_per_project} bullet points per project:
   - Each bullet MUST start with a DIFFERENT action verb from: {verb_list}
   - Each bullet MUST be 15-20 words. MUST fit on ONE single line — do NOT exceed 20 words.
   - At least 2 bullets MUST have a quantifiable metric (users, endpoints, features, performance %)
   - Include ATS keywords: scalable, performance, api, data, end-to-end, agile, etc.
5. Do NOT change the project's fundamental nature.
6. Do NOT add technologies not in techStack.
7. Pattern: [Action Verb] + [What] + [Technology] + [Impact]

EXAMPLE BULLETS (15-20 words each, ONE line):
"Built responsive dashboard using React and Chart.js, visualizing 50+ real-time metrics."
"Implemented RESTful API with Node.js and MongoDB, supporting 500+ user records."
"Deployed on cloud with CI/CD pipeline, achieving 99.5% uptime across environments."
"Optimized front-end performance with lazy loading, reducing page load time by 40%."

Return JSON with 'projects' array.
"""
    try:
        res = await llm.ainvoke(prompt)
        entries = []
        for x in res.projects:
            d = x.dict()
            bullets = d.get("bullets", [])
            while len(bullets) < bullets_per_project:
                bullets.append(f"Delivered key features using modern development practices and workflows.")
            d["bullets"] = bullets[:bullets_per_project]
            entries.append(d)
        return {"projects": entries}
    except Exception as e:
        print("Projects gen error:", e)
        return {"projects": state["profile"]["projects"]}


async def optimize_skills(state: ResumeState):
    if "skills" not in state.get("template_sections", []):
        return {"skills": state["profile"].get("skills", [])}

    llm = get_llm().with_structured_output(SkillsOutput)
    existing_skills = state["profile"].get("skills", [])
    experience = state["profile"].get("experience", [])
    projects = state["profile"].get("projects", [])

    prompt = f"""You are an expert ATS Resume Writer. Generate a curated list of exactly 10-15 technical skills for this candidate.

TARGET ROLE: "{state['target_role']}"

CANDIDATE'S EXISTING SKILLS (VERIFIED): {existing_skills}
CANDIDATE'S EXPERIENCE: {experience}
CANDIDATE'S PROJECTS: {projects}

MANDATORY REQUIREMENTS:
1. Return exactly 10 to 15 skills — this is critical for ATS keyword coverage.
2. AT LEAST 70% must come directly from the candidate's existing skills list.
3. Include ATS-critical keywords that match the target role: python, javascript, typescript, react, node, sql, api, rest, cloud, aws, gcp, azure, docker, kubernetes, ci/cd, git, agile, scrum, data, analytics, machine learning, microservices, full-stack, scalable, performance, architecture.
4. You may add industry-standard skills clearly inferable from experience/projects:
   - Built web apps → "HTML/CSS", "Responsive Design" are fair
   - Used databases → "Database Management", "SQL" are fair
   - Team work → "Agile", "Cross-functional Collaboration" are fair
5. Do NOT add highly specialized skills with no basis in the candidate's background.
6. Each skill: 1-3 words max (e.g., "Python", "Cloud Architecture", "CI/CD Pipelines").
7. Order from most relevant to least relevant for the target role.
8. No duplicates. No synonyms of the same skill.

Return JSON with 'skills' list.
"""
    try:
        res = await llm.ainvoke(prompt)
        skills = res.skills[:15] if len(res.skills) > 15 else res.skills
        if len(skills) < 10 and existing_skills:
            for s in existing_skills:
                if s not in skills and len(skills) < 10:
                    skills.append(s)
        return {"skills": skills}
    except Exception as e:
        print("Skills gen error:", e)
        return {"skills": existing_skills[:15] if existing_skills else []}

builder = StateGraph(ResumeState)

builder.add_node("optimize_summary", optimize_summary)
builder.add_node("optimize_experience", optimize_experience)
builder.add_node("optimize_projects", optimize_projects)
builder.add_node("optimize_skills", optimize_skills)

builder.add_edge(START, "optimize_summary")
builder.add_edge(START, "optimize_experience")
builder.add_edge(START, "optimize_projects")
builder.add_edge(START, "optimize_skills")

builder.add_edge("optimize_summary", END)
builder.add_edge("optimize_experience", END)
builder.add_edge("optimize_projects", END)
builder.add_edge("optimize_skills", END)

graph = builder.compile()

async def run_resume_optimization(profile: dict, target_role: str, template_sections: list) -> dict:
    state = {
        "profile": profile,
        "target_role": target_role,
        "template_sections": template_sections,
        "summary": "",
        "experience": [],
        "projects": [],
        "skills": []
    }
    
    result = await graph.ainvoke(state)
    return {
        "summary": result.get("summary", ""),
        "experience": result.get("experience", []),
        "projects": result.get("projects", []),
        "skills": result.get("skills", [])
    }
