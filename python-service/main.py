from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import jinja2
import subprocess
import os
import uuid
import glob
import time
from optimizer import run_resume_optimization

app = FastAPI()

# ── Jinja2 setup ──────────────────────────────────────────────────────────────
template_loader = jinja2.FileSystemLoader(searchpath="./templates")
template_env = jinja2.Environment(
    loader=template_loader,
    block_start_string=r'\BLOCK{',
    block_end_string='}',
    variable_start_string=r'\VAR{',
    variable_end_string='}',
    comment_start_string=r'\#{',
    comment_end_string='}',
    # Trim whitespace around block tags so LaTeX output is clean
    trim_blocks=True,
    lstrip_blocks=True,
)

TEMP_DIR = os.path.abspath("temp_gen")
os.makedirs(TEMP_DIR, exist_ok=True)

# ── Helpers ───────────────────────────────────────────────────────────────────

def escape_latex(data):
    """Recursively escape LaTeX special characters. Converts None → empty string."""
    if data is None:
        return ""
    if isinstance(data, bool):
        return str(data)
    if isinstance(data, (int, float)):
        return str(data)
    if isinstance(data, str):
        replacements = [
            ('\\', r'\textbackslash{}'),
            ('{',  r'\{'),
            ('}',  r'\}'),
            ('&',  r'\&'),
            ('%',  r'\%'),
            ('$',  r'\$'),
            ('#',  r'\#'),
            ('_',  r'\_'),
            ('^',  r'\textasciicircum{}'),
            ('~',  r'\textasciitilde{}'),
        ]
        for old, new in replacements:
            data = data.replace(old, new)
        return data
    if isinstance(data, dict):
        return {k: escape_latex(v) for k, v in data.items()}
    if isinstance(data, list):
        return [escape_latex(i) for i in data]
    return data


def normalize_education(edu_list: list) -> list:
    """
    Normalize education field names so LaTeX templates always get consistent keys.
    The AI/parse route may return 'school'/'grade' while templates expect 'institution'/'score'.
    """
    normalized = []
    for edu in edu_list:
        if not isinstance(edu, dict):
            continue
        normalized.append({
            # institution: accept 'institution', 'school', 'name'
            "institution": edu.get("institution") or edu.get("school") or edu.get("name") or "",
            # degree: accept 'degree', 'fieldOfStudy' appended
            "degree": _build_degree(edu),
            # score: accept 'score', 'grade', 'gpa'
            "score": edu.get("score") or edu.get("grade") or edu.get("gpa") or "",
            "startDate": edu.get("startDate") or "",
            "endDate": edu.get("endDate") or edu.get("graduationDate") or "",
            "coursework": edu.get("coursework") or "",
        })
    return normalized


def _build_degree(edu: dict) -> str:
    degree = edu.get("degree") or ""
    field = edu.get("fieldOfStudy") or ""
    if degree and field and field.lower() not in degree.lower():
        return f"{degree} in {field}"
    return degree or field


def normalize_experience(exp_list: list) -> list:
    """Normalize experience: ensure 'bullets' is always a list."""
    normalized = []
    for exp in exp_list:
        if not isinstance(exp, dict):
            continue
        # bullets may be a list already, or a raw description string
        bullets = exp.get("bullets") or []
        if not bullets:
            desc = exp.get("description") or exp.get("summary") or ""
            if desc:
                # Split on newlines or bullet markers
                import re
                bullets = [b.strip().lstrip("•-* ") for b in re.split(r'[\n•\-\*]+', desc) if b.strip()]
        normalized.append({
            "company":   exp.get("company") or "",
            "role":      exp.get("role") or exp.get("position") or exp.get("title") or "",
            "startDate": exp.get("startDate") or "",
            "endDate":   exp.get("endDate") or "Present",
            "location":  exp.get("location") or "",
            "bullets":   bullets,
        })
    return normalized


def normalize_projects(proj_list: list) -> list:
    normalized = []
    for proj in proj_list:
        if not isinstance(proj, dict):
            continue
        tech = proj.get("techStack") or proj.get("technologies") or proj.get("tech") or []
        if isinstance(tech, str):
            tech = [t.strip() for t in tech.split(",") if t.strip()]
        # Ensure bullets is always a list
        bullets = proj.get("bullets") or []
        if isinstance(bullets, str):
            import re
            bullets = [b.strip().lstrip("•-* ") for b in re.split(r'[\n•\-*]+', bullets) if b.strip()]
        normalized.append({
            "title":       proj.get("title") or proj.get("name") or "",
            "role":        proj.get("role") or "",
            "link":        proj.get("link") or proj.get("url") or "",
            "techStack":   tech,
            "description": proj.get("description") or "",
            "bullets":     bullets,
        })
    return normalized


def normalize_achievements(ach_list: list) -> list:
    """
    Normalize achievements to always be a list of plain strings.
    The AI returns achievements as string[], but some old data may have
    objects with title/organization/dateReceived.
    """
    result = []
    for ach in ach_list:
        if isinstance(ach, str) and ach.strip():
            result.append(ach)
        elif isinstance(ach, dict):
            # Convert structured object to readable string
            parts = []
            if ach.get("title"):
                parts.append(ach["title"])
            if ach.get("organization"):
                parts.append(f"— {ach['organization']}")
            if ach.get("dateReceived"):
                parts.append(f"({ach['dateReceived']})")
            combined = " ".join(parts) if parts else ""
            if combined.strip():
                result.append(combined)
    return result


def normalize_links(personal_info: dict) -> list:
    if not isinstance(personal_info, dict):
        return []
    links = []
    for link in personal_info.get("displayLinks") or []:
        if not isinstance(link, dict):
            continue
        label = str(link.get("label") or "").strip()
        url = str(link.get("url") or "").strip()
        if label and url:
            links.append({"label": label, "url": url})
    return links[:4]


def _has_meaningful_value(value):
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return any(_has_meaningful_value(v) for v in value)
    if isinstance(value, dict):
        return any(_has_meaningful_value(v) for v in value.values())
    return bool(value)


def prune_empty_records(items: list, keys: list) -> list:
    pruned = []
    for item in items:
        if not isinstance(item, dict):
            continue
        if any(_has_meaningful_value(item.get(k)) for k in keys):
            pruned.append(item)
    return pruned


def cleanup_old_files(max_age_seconds: int = 300):
    """Delete temp files older than max_age_seconds to prevent disk bloat."""
    now = time.time()
    for pattern in ["*.tex", "*.pdf", "*.log", "*.aux"]:
        for f in glob.glob(os.path.join(TEMP_DIR, pattern)):
            try:
                if now - os.path.getmtime(f) > max_age_seconds:
                    os.remove(f)
            except OSError:
                pass


# ── Request model ─────────────────────────────────────────────────────────────

class ResumeRequest(BaseModel):
    data: dict
    template_id: str

class OptimizeRequest(BaseModel):
    profile: dict
    target_role: str
    template_sections: list

# ── Endpoint ──────────────────────────────────────────────────────────────────

@app.post("/optimize-resume")
async def optimize_resume(req: OptimizeRequest):
    try:
        optimized = await run_resume_optimization(req.profile, req.target_role, req.template_sections)
        return {"success": True, "data": optimized}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-pdf")
async def generate_pdf(req: ResumeRequest):
    # Clean up stale temp files opportunistically
    cleanup_old_files()

    request_id = str(uuid.uuid4())
    tex_path = os.path.join(TEMP_DIR, f"{request_id}.tex")
    pdf_path = os.path.join(TEMP_DIR, f"{request_id}.pdf")

    # 1. Normalize data so all templates get consistent field names
    raw = req.data
    normalized = {
        **raw,
        "education":  prune_empty_records(normalize_education(raw.get("education") or []), ["institution", "degree", "score", "coursework"]),
        "experience": prune_empty_records(normalize_experience(raw.get("experience") or []), ["company", "role", "location", "bullets"]),
        "projects":   prune_empty_records(normalize_projects(raw.get("projects") or []), ["title", "role", "link", "description", "bullets", "techStack"]),
        # Ensure skills is always a list of strings
        "skills": (
            raw.get("skills") if isinstance(raw.get("skills"), list)
            else [s.strip() for s in (raw.get("skills") or "").split(",") if s.strip()]
        ),
        # Normalize achievements: always a list of plain strings
        "achievements": normalize_achievements(raw.get("achievements") or []),
        # Certifications: list of strings
        "certifications": [
            c for c in (raw.get("certifications") or [])
            if isinstance(c, str) and c.strip()
        ],
        # Publications: list of dicts
        "publications": [
            p for p in (raw.get("publications") or [])
            if isinstance(p, dict) and p.get("title", "").strip()
        ],
        # Ensure personalInfo has a headline fallback (some templates use it)
        "personalInfo": {
            **(raw.get("personalInfo") or {}),
            "headline": (
                (raw.get("personalInfo") or {}).get("headline")
                or (raw.get("personalInfo") or {}).get("summary")
                or ""
            ),
            "displayLinks": normalize_links(raw.get("personalInfo") or {}),
        },
    }

    # 1b. Strip empty sections — if a section has no real content, set to empty
    #     so template \BLOCK{if ...} guards properly skip them
    for list_key in ("experience", "education", "projects", "skills", "achievements", "certifications", "publications"):
        val = normalized.get(list_key)
        if not val or (isinstance(val, list) and len(val) == 0):
            normalized[list_key] = []

    # Strip empty summary and trim string fields.
    pi = normalized.get("personalInfo", {})
    if not pi.get("summary") or (isinstance(pi.get("summary"), str) and not pi["summary"].strip()):
        pi["summary"] = ""
    for field in ("fullName", "headline", "email", "phone", "location", "linkedin", "github", "portfolio", "summary"):
        if isinstance(pi.get(field), str):
            pi[field] = pi[field].strip()
    normalized["personalInfo"] = pi

    # 2. Escape LaTeX special chars (None → "")
    escaped = escape_latex(normalized)

    # 3. Load template
    safe_id = os.path.basename(req.template_id)
    template_path = None
    for folder in ("standard", "premium"):
        for suffix in ("", ".tex"):
            candidate = f"{folder}/{safe_id}{suffix}"
            if os.path.exists(os.path.join("./templates", candidate)):
                template_path = candidate
                break
        if template_path:
            break

    if not template_path:
        raise HTTPException(status_code=404, detail=f"Template '{safe_id}' not found")

    try:
        template = template_env.get_template(template_path)
    except jinja2.TemplateNotFound:
        raise HTTPException(status_code=404, detail=f"Template '{safe_id}' not found")

    # 4. Render LaTeX
    try:
        rendered_tex = template.render(data=escaped)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template rendering failed: {e}")

    # 5. Write .tex file
    with open(tex_path, "w", encoding="utf-8") as f:
        f.write(rendered_tex)

    # 6. Compile with pdflatex — run TWICE for correct layout (multi-column templates need it)
    compile_args = [
        "pdflatex",
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-output-directory", TEMP_DIR,
        tex_path,
    ]

    try:
        for run in range(2):
            result = subprocess.run(
                compile_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=30,  # Hard timeout — prevents hanging requests
            )
            if not os.path.exists(pdf_path):
                log_path = tex_path.replace(".tex", ".log")
                log_content = ""
                if os.path.exists(log_path):
                    with open(log_path, "r", encoding="latin-1") as lf:
                        log_content = lf.read()[-3000:]  # Last 3000 chars of log
                raise HTTPException(
                    status_code=500,
                    detail=f"LaTeX compile failed (pass {run+1}): {result.stdout[-500:]}\n\nLOG:\n{log_content}"
                )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="PDF compilation timed out (>30s)")

    # 7. Read PDF bytes and return directly (avoids FileResponse disk-read race)
    try:
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()
    finally:
        # Clean up this request's files immediately
        for ext in (".tex", ".pdf", ".log", ".aux"):
            try:
                os.remove(os.path.join(TEMP_DIR, f"{request_id}{ext}"))
            except OSError:
                pass

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="resume.pdf"'},
    )

if __name__ == "__main__":
    import uvicorn
    import subprocess
    # Attempt to kill any existing process running on port 8000
    try:
        subprocess.run("kill -9 $(lsof -t -i:8000)", shell=True, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
        time.sleep(1)
    except Exception:
        pass
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
