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
        temperature=0.2,       # Lowered from 0.3 — less creative = less hallucination
        max_output_tokens=2048,
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

# ── Helper: build a concise snapshot of the candidate's real background ────────
def _candidate_snapshot(profile: dict) -> str:
    """Build a compact textual snapshot of the candidate's REAL background.
    This is injected into every prompt so the AI knows the ground truth."""
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
    prompt = f"""You are an expert ATS Resume Writer. Write a 2-3 sentence professional summary for this candidate.

CANDIDATE PROFILE (YOUR PRIMARY AND ONLY SOURCE — base the summary EXCLUSIVELY on this):
- Headline: "{headline}"
- Years of Experience: "{years_of_exp}" (use this exact number, do NOT guess or inflate)
- Current Summary written by candidate: "{current_summary}"
- Experience history: {experience}
- Skills: {skills}

TARGET ROLE (USE ONLY AS SUBTLE CONTEXT — do NOT copy from this):
"{state['target_role']}"

ABSOLUTE RULES — VIOLATION IS UNACCEPTABLE:
1. The summary MUST be rooted ONLY in the CANDIDATE'S OWN background — their actual experience, skills, and achievements.
2. Use the target role ONLY to decide which of the candidate's EXISTING strengths to emphasize. Do NOT copy JD phrases verbatim.
3. If yearsOfExperience is provided, use it verbatim (e.g., "2+ years", "fresher"). Do NOT fabricate experience duration.
4. Do NOT mention any company name from the target job posting.
5. Do NOT invent skills, technologies, certifications, or achievements the candidate does not have.
6. Keep it natural, confident, and concise — 2 to 3 sentences max.
7. Write in third person without using the candidate's name (e.g. "Results-driven engineer with...").
8. If the candidate is a fresher/student, frame it accordingly — do NOT pretend they have professional experience.
Return ONLY JSON with 'summary'.
"""
    try:
        res = await llm.ainvoke(prompt)
        return {"summary": res.summary}
    except Exception as e:
        print("Summary gen error:", e)
        return {"summary": current_summary}

async def optimize_experience(state: ResumeState):
    if "experience" not in state.get("template_sections", []) or not state["profile"].get("experience"):
        return {"experience": state["profile"].get("experience", [])}

    snapshot = _candidate_snapshot(state["profile"])
    
    llm = get_llm().with_structured_output(ExperienceOutputList)
    prompt = f"""You are an expert ATS Resume Writer. Rewrite the bullet points for ALL experience entries below.

CANDIDATE'S VERIFIED BACKGROUND (ground truth — do NOT contradict this):
{snapshot}

TARGET ROLE (for keyword emphasis only):
"{state['target_role']}"

INPUT EXPERIENCE DATA (this is the candidate's REAL experience):
{state['profile']['experience']}

ABSOLUTE RULES — VIOLATION IS UNACCEPTABLE:
1. PRESERVE EXACTLY (copy character-for-character): company, role, startDate, endDate, location. Do NOT change these.
2. Generate exactly 3 to 4 bullet points per experience entry. Never exceed 4 bullets.
3. Each bullet must start with a strong action verb and be 1-2 lines max.
4. ONLY use information that exists in the input data. If the candidate didn't mention a metric, do NOT invent one.
5. You may REFRAME existing accomplishments to emphasize relevance to the target role — but NEVER fabricate new ones.
6. Do NOT add technologies, tools, or platforms the candidate didn't mention in their experience or skills.
7. Do NOT parrot exact phrases, company names, or hyper-specific requirement terms from the target role description.
8. If the original bullet mentions a number/metric, you may keep it. If it doesn't, do NOT make up numbers.
9. Abstract target requirements into demonstrable core competencies only if the candidate's data supports them.

EXAMPLE OF WHAT NOT TO DO:
- Input bullet: "Built a REST API for user management"
- BAD output: "Architected microservices handling 10M+ requests/day using AWS Lambda" (fabricated scale, tech)
- GOOD output: "Developed a RESTful API for user management, improving data access efficiency"

Return JSON with 'experience' array matching the EXACT same number of entries as input.
"""
    try:
        res = await llm.ainvoke(prompt)
        # Enforce max 4 bullets
        entries = []
        for x in res.experience:
            d = x.dict()
            d["bullets"] = d.get("bullets", [])[:4]
            entries.append(d)
        return {"experience": entries}
    except Exception as e:
        print("Experience gen error:", e)
        return {"experience": state["profile"]["experience"]}

async def optimize_projects(state: ResumeState):
    if "projects" not in state.get("template_sections", []) or not state["profile"].get("projects"):
        return {"projects": state["profile"].get("projects", [])}

    snapshot = _candidate_snapshot(state["profile"])
    
    llm = get_llm().with_structured_output(ProjectOutputList)
    prompt = f"""You are an expert ATS Resume Writer. For each project below, generate a polished description AND 2-3 concise bullet points.

CANDIDATE'S VERIFIED BACKGROUND (ground truth):
{snapshot}

TARGET ROLE (for keyword emphasis only):
"{state['target_role']}"

INPUT PROJECTS (these are the candidate's REAL projects):
{state['profile']['projects']}

ABSOLUTE RULES — VIOLATION IS UNACCEPTABLE:
1. PRESERVE EXACTLY (copy character-for-character): title, role, link, techStack. Do NOT change, add, or remove these.
2. Return EXACTLY the same number of projects as the input. Do NOT add or remove projects.
3. Rewrite 'description': 1-2 sentences that capture what the project does and its impact. Base this on the user's ORIGINAL description — refine and polish, don't replace the core idea.
4. Generate 2-3 'bullets': concise achievement-style points highlighting technical skills and impact.
5. Do NOT change the fundamental nature of the project. If the user built an e-commerce site, do NOT turn it into a machine learning platform.
6. Do NOT add technologies to the description/bullets that are NOT in the project's techStack.
7. Do NOT fabricate user counts, performance metrics, or scale numbers that aren't in the original data.
8. Emphasize aspects most relevant to the target role, but keep it truthful to what the user actually built.
9. Do NOT copy exact phrases or company names from the target role description.

EXAMPLE OF WHAT NOT TO DO:
- Input: title="Todo App", techStack=["React", "Firebase"], description="A simple task manager"
- BAD: "Enterprise-grade project management platform serving 50K+ users with real-time collaboration"
- GOOD: "Full-stack task management application with real-time data sync, built using React and Firebase"

Return JSON with 'projects' array.
"""
    try:
        res = await llm.ainvoke(prompt)
        entries = []
        for x in res.projects:
            d = x.dict()
            d["bullets"] = d.get("bullets", [])[:3]
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

    prompt = f"""You are an expert ATS Resume Writer and technical recruiter. Generate a curated list of exactly 8 to 12 skills for this candidate's resume.

TARGET ROLE / JOB DESCRIPTION: "{state['target_role']}"

CANDIDATE'S EXISTING SKILLS (these are VERIFIED — prioritize these): {existing_skills}
CANDIDATE'S EXPERIENCE: {experience}
CANDIDATE'S PROJECTS: {projects}

ABSOLUTE RULES — VIOLATION IS UNACCEPTABLE:
1. AT LEAST 70% of skills must come DIRECTLY from the candidate's existing skills list.
2. You may reorder skills to prioritize those most relevant to the target role.
3. You may include industry-standard skills IF they can be CLEARLY inferred from the candidate's experience or projects:
   - Example: If they built REST APIs, "API Development" is fair game.
   - Example: If they used React, "Component-Based Architecture" is fair game.
4. Do NOT invent highly specialized or niche skills the candidate clearly has no background in.
   - BAD: Adding "Kubernetes" when the candidate has no DevOps/cloud experience.
   - BAD: Adding "TensorFlow" when the candidate has no ML projects.
5. Return exactly 8 to 12 skills total — no more, no less.
6. Keep each skill concise (1-3 words max, e.g. "Python", "Cloud Architecture", "CI/CD Pipelines").
7. Do NOT duplicate skills (even rephrased versions of the same skill).
8. Order from most relevant to least relevant for the target role.

Return JSON with 'skills' list.
"""
    try:
        res = await llm.ainvoke(prompt)
        # Ensure we get 8-12 skills
        skills = res.skills[:12] if len(res.skills) > 12 else res.skills
        if len(skills) < 8 and existing_skills:
            # Pad with existing skills if AI returned too few
            for s in existing_skills:
                if s not in skills and len(skills) < 8:
                    skills.append(s)
        return {"skills": skills}
    except Exception as e:
        print("Skills gen error:", e)
        return {"skills": existing_skills[:12] if existing_skills else []}

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
