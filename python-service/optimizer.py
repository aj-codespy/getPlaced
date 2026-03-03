import os
from dotenv import load_dotenv
import operator
from typing import TypedDict, List, Optional, Annotated
from langgraph.graph import StateGraph, START, END
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

# Ensure we load the .env from the web directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "web", ".env"))

class ResumeState(TypedDict):
    profile: dict
    target_role: str
    template_sections: list
    
    input_tokens: Annotated[int, operator.add]
    output_tokens: Annotated[int, operator.add]
    
    # Outputs
    summary: str
    experience: list
    projects: list
    skills: list

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
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

    llm = get_llm().with_structured_output(SummaryOutput, include_raw=True)
    prompt = f"""You are an expert ATS Resume Writer. Write a professional summary of EXACTLY 2-3 sentences (35-55 words) for this candidate.

CANDIDATE PROFILE (YOUR ONLY SOURCE):
- Headline: "{headline}"
- Years of Experience: "{years_of_exp}"
- Current Summary: "{current_summary}"
- Experience: {experience}
- Skills: {skills}

TARGET ROLE: "{state['target_role']}"

MANDATORY REQUIREMENTS:
1. MUST be exactly 2-3 sentences, each ending with a period.
2. MUST be 35-55 words total.
3. Write in FIRST PERSON from the user's point of view — do NOT use third person.
4. Start naturally (e.g., "Passionate engineer with...", "Experienced developer specializing in...").
5. MUST mention at least 2 specific technical skills from the candidate's actual skill set.
6. MUST include at least ONE quantifiable element (e.g., "2+ years", "5+ projects").
7. Include 1-2 ATS keywords: scalable, performance, agile, data, end-to-end, full-stack.
8. Use only information from the candidate's data — do NOT invent.
9. If candidate is a fresher, frame as: "Aspiring [field] professional with hands-on experience in [skills]."

GOOD EXAMPLE: "Passionate AI engineer with hands-on experience building RAG systems and NLP pipelines using Python, FAISS, and LLMs. Delivered 3+ production-grade projects focused on scalable data processing and performance optimization."

Return JSON with 'summary'.
"""
    try:
        res = await llm.ainvoke(prompt)
        parsed = res.get("parsed") or SummaryOutput(summary="")
        raw = res.get("raw")
        usage = raw.usage_metadata if raw and hasattr(raw, "usage_metadata") else {}
        usage = usage or {}
        
        return {
            "summary": parsed.summary,
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0)
        }
    except Exception as e:
        print("Summary gen error:", e)
        # Generate a basic summary as fallback rather than returning empty
        fallback = current_summary or f"Motivated professional with expertise in {', '.join(skills[:3]) if skills else 'relevant technical skills'}. Seeking to leverage technical abilities and project experience in a challenging role."
        return {"summary": fallback}


async def optimize_experience(state: ResumeState):
    if "experience" not in state.get("template_sections", []) or not state["profile"].get("experience"):
        return {"experience": [], "input_tokens": 0, "output_tokens": 0}

    input_experience = state["profile"].get("experience", [])
    snapshot = _candidate_snapshot(state["profile"])
    verb_list = ", ".join(ACTION_VERBS[:20])
    
    llm = get_llm().with_structured_output(ExperienceOutputList, include_raw=True)
    prompt = f"""You are an expert ATS Resume Writer. Rewrite the bullet points for ALL experience entries to be ATS-optimized, metrics-rich, and impactful.

CANDIDATE'S VERIFIED BACKGROUND:
{snapshot}

TARGET ROLE: "{state['target_role']}"

INPUT EXPERIENCE: {input_experience}

MANDATORY REQUIREMENTS FOR EVERY BULLET:
1. PRESERVE EXACTLY: company, role, startDate, endDate, location. Copy character-for-character.
2. Generate EXACTLY 4 bullet points per experience entry.
3. Sort the returned experience array in reverse chronological order (most recent first) based on the dates.
4. EVERY bullet MUST start with a DIFFERENT strong action verb from: {verb_list}
5. EVERY bullet MUST be 12-17 words. Keep it concise — one line only.
6. At least 2 of 4 bullets MUST contain a metric (X%, X+, $X, X users).
7. Include ATS keywords: api, cloud, agile, scalable, performance, data, etc.
8. Pattern: [Verb] + [What] + [Tech] + [Impact]
9. Do NOT fabricate.

EXAMPLES (12-17 words, ONE line each):
"Developed 3 RESTful APIs using Node.js, serving 500+ daily users."
"Optimized database queries by 40%, reducing response time to 480ms."
"Led agile sprints with 5 engineers, delivering milestones ahead of schedule."
"Automated CI/CD with Docker, cutting deployment time by 60%."

Return JSON with 'experience' array with EXACTLY the same number of entries as input ({len(input_experience)} entries).
"""
    try:
        res = await llm.ainvoke(prompt)
        parsed = res.get("parsed") or ExperienceOutputList(experience=[])
        raw = res.get("raw")
        usage = raw.usage_metadata if raw and hasattr(raw, "usage_metadata") else {}
        usage = usage or {}

        entries = []
        for x in parsed.experience:
            d = x.dict()
            # Enforce exactly 4 bullets — pad if needed
            bullets = d.get("bullets", [])
            while len(bullets) < 4:
                bullets.append(f"Contributed to project development using modern technologies and best practices.")
            d["bullets"] = bullets[:4]
            entries.append(d)
        return {
            "experience": entries,
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0)
        }
    except Exception as e:
        print("Experience gen error:", e)
        return {"experience": input_experience}


async def optimize_projects(state: ResumeState):
    if "projects" not in state.get("template_sections", []) or not state["profile"].get("projects"):
        return {"projects": [], "input_tokens": 0, "output_tokens": 0}

    input_projects = state["profile"].get("projects", [])
    num_exp = len(state["profile"].get("experience", []))
    target_proj_count = max(0, 4 - num_exp)
    
    if target_proj_count == 0:
        return {"projects": [], "input_tokens": 0, "output_tokens": 0}
        
    actual_proj_count = min(target_proj_count, len(input_projects))

    snapshot = _candidate_snapshot(state["profile"])
    verb_list = ", ".join(ACTION_VERBS[:20])
    
    # Always generate 4 bullets per project for maximum word count and ATS scoring
    has_experience = bool(state["profile"].get("experience"))
    bullets_per_project = 4
    
    llm = get_llm().with_structured_output(ProjectOutputList, include_raw=True)
    prompt = f"""You are an expert ATS Resume Writer. For the given projects, SELECT EXACTLY {actual_proj_count} projects that BEST match the target role, generate a polished description, AND exactly {bullets_per_project} bullet points that maximize ATS score.

{"NOTE: This candidate has NO work experience. Projects are their PRIMARY section. Generate rich, detailed, impactful bullets." if not has_experience else ""}

CANDIDATE'S VERIFIED BACKGROUND:
{snapshot}

TARGET ROLE: "{state['target_role']}"

INPUT PROJECTS: {input_projects}

MANDATORY REQUIREMENTS:
1. SELECT EXACTLY {actual_proj_count} projects from the input that are MOST relevant to the target role.
2. PRESERVE EXACTLY: title, role, link, techStack for the selected projects — copy character-for-character.
3. Return EXACTLY {actual_proj_count} selected projects.
4. 'description': Rewrite as 1 sentence (12-20 words). Mention core tech and goal.
5. 'bullets': Generate EXACTLY {bullets_per_project} bullet points per project:
   - Each bullet: DIFFERENT action verb from: {verb_list}
   - Each bullet: 12-17 words. ONE line only.
   - At least 2 bullets MUST have a metric (users, %, endpoints).
   - Include ATS keywords: scalable, performance, api, data, agile, etc.
6. Do NOT change the project's nature or add unlisted tech.
7. Pattern: [Verb] + [What] + [Tech] + [Impact]

EXAMPLES (12-17 words, ONE line):
"Built responsive dashboard with React and Chart.js, visualizing 50+ metrics."
"Implemented REST API with Node.js and MongoDB for 500+ users."
"Deployed on cloud with CI/CD pipeline, achieving 99.5% uptime."
"Optimized load performance with lazy loading, reducing time by 40%."

Return JSON with 'projects' array containing EXACTLY {actual_proj_count} selected projects.
"""
    try:
        res = await llm.ainvoke(prompt)
        parsed = res.get("parsed") or ProjectOutputList(projects=[])
        raw = res.get("raw")
        usage = raw.usage_metadata if raw and hasattr(raw, "usage_metadata") else {}
        usage = usage or {}

        entries = []
        for x in parsed.projects[:actual_proj_count]:
            d = x.dict()
            bullets = d.get("bullets", [])
            while len(bullets) < bullets_per_project:
                bullets.append(f"Delivered key features using modern practices and workflows.")
            d["bullets"] = bullets[:bullets_per_project]
            entries.append(d)
        return {
            "projects": entries,
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0)
        }
    except Exception as e:
        print("Projects gen error:", e)
        return {"projects": input_projects[:actual_proj_count]}


async def optimize_skills(state: ResumeState):
    if "skills" not in state.get("template_sections", []):
        return {"skills": state["profile"].get("skills", []), "input_tokens": 0, "output_tokens": 0}

    llm = get_llm().with_structured_output(SkillsOutput, include_raw=True)
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
        parsed = res.get("parsed") or SkillsOutput(skills=[])
        raw = res.get("raw")
        usage = raw.usage_metadata if raw and hasattr(raw, "usage_metadata") else {}
        usage = usage or {}

        skills = parsed.skills[:15] if len(parsed.skills) > 15 else parsed.skills
        if len(skills) < 10 and existing_skills:
            for s in existing_skills:
                if s not in skills and len(skills) < 10:
                    skills.append(s)
        return {
            "skills": skills,
            "input_tokens": usage.get("input_tokens", 0),
            "output_tokens": usage.get("output_tokens", 0)
        }
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
        "skills": [],
        "input_tokens": 0,
        "output_tokens": 0
    }
    
    result = await graph.ainvoke(state)
    return {
        "summary": result.get("summary", ""),
        "experience": result.get("experience", []),
        "projects": result.get("projects", []),
        "skills": result.get("skills", []),
        "input_tokens": result.get("input_tokens", 0),
        "output_tokens": result.get("output_tokens", 0)
    }
