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
        temperature=0.3,
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

CANDIDATE PROFILE (YOUR PRIMARY SOURCE — base the summary on this):
- Headline: "{headline}"
- Years of Experience: "{years_of_exp}" (use this exact number, do NOT guess or inflate)
- Current Summary written by candidate: "{current_summary}"
- Experience history: {experience}
- Skills: {skills}

TARGET ROLE (USE ONLY AS SUBTLE CONTEXT — do NOT copy from this):
"{state['target_role']}"

RULES:
1. The summary must be rooted in the CANDIDATE'S OWN background — their actual experience, skills, and achievements.
2. Use the target role ONLY to decide which of the candidate's existing strengths to emphasize. Do NOT copy JD phrases.
3. If yearsOfExperience is provided, use it verbatim (e.g., "2+ years", "fresher"). Do NOT fabricate experience duration.
4. Do NOT mention any company name from the target job posting.
5. Keep it natural, confident, and concise — 2 to 3 sentences max.
6. Write in third person without using the candidate's name (e.g. "Results-driven engineer with...").
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

    llm = get_llm().with_structured_output(ExperienceOutputList)
    prompt = f"""You are an expert ATS Resume Writer. Rewrite the bullet points for ALL experience entries to naturally highlight qualifications for the target role: "{state['target_role']}".
INPUT EXPERIENCE: {state['profile']['experience']}
RULES:
1. Preserve exactly: company, role, startDate, endDate, location.
2. Generate exactly 3 to 4 bullet points per experience entry. Never exceed 4 bullets.
3. Each bullet must start with a strong action verb and be 1-2 lines max.
4. Quantify metrics where possible WITHOUT inventing fake numbers — use the candidate's actual data.
5. Subtlety is key: Do NOT parrot exact phrases, company names, or hyper-specific requirement terms from the target role description.
6. Abstract the target requirements into demonstrable core competencies (e.g., instead of copying "AWS EC2", describe scalable cloud infrastructure work if applicable). Make the candidate look highly qualified organically.
Return JSON with 'experience' array matching the same number of entries.
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

    llm = get_llm().with_structured_output(ProjectOutputList)
    prompt = f"""You are an expert ATS Resume Writer. For each project below, generate a polished description AND 2-3 concise bullet points that highlight the project's impact and relevance to the target role.

TARGET ROLE: "{state['target_role']}"
INPUT PROJECTS: {state['profile']['projects']}

RULES:
1. Preserve exactly: title, role, link, techStack. Do NOT change these.
2. Rewrite the 'description' field: 1-2 sentences that capture what the project does and its impact. This should be based on the user's original description — refine and polish it, don't replace the core idea.
3. Generate 2-3 'bullets': concise achievement-style points highlighting technical skills and impact, relevant to the target role.
4. Do NOT change the fundamental nature of the project. If the user built an e-commerce site, don't turn it into a machine learning platform.
5. Emphasize the aspects of the project most relevant to the target role, but keep it truthful to what the user actually built.
6. Do NOT copy exact phrases or company names from the target role description.
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

    prompt = f"""You are an expert ATS Resume Writer and technical recruiter. Generate a curated list of exactly 7 to 10 skills for this candidate's resume.

TARGET ROLE / JOB DESCRIPTION: "{state['target_role']}"

CANDIDATE'S EXISTING SKILLS: {existing_skills}
CANDIDATE'S EXPERIENCE: {experience}
CANDIDATE'S PROJECTS: {projects}

RULES:
1. Prioritize skills the candidate ALREADY has that are relevant to the target role. These should come first.
2. You may include widely-expected industry-standard skills for the target role IF they can be reasonably inferred from the candidate's experience or projects (e.g., if they built REST APIs, "API Design" is fair game).
3. Do NOT invent highly specialized or niche skills the candidate clearly has no background in.
4. Return exactly 7 to 10 skills total — no more, no less.
5. Order them from most relevant to least relevant for the target role.
6. Keep each skill concise (1-3 words max, e.g. "Python", "Cloud Architecture", "CI/CD Pipelines").
7. Do NOT duplicate skills.

Return JSON with 'skills' list.
"""
    try:
        res = await llm.ainvoke(prompt)
        # Ensure we get 7-10 skills
        skills = res.skills[:10] if len(res.skills) > 10 else res.skills
        if len(skills) < 7 and existing_skills:
            # Pad with existing skills if AI returned too few
            for s in existing_skills:
                if s not in skills and len(skills) < 7:
                    skills.append(s)
        return {"skills": skills}
    except Exception as e:
        print("Skills gen error:", e)
        return {"skills": existing_skills[:10] if existing_skills else []}

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
