
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { resumeText } = await req.json();

        if (!resumeText) {
            return NextResponse.json({ error: "No resume text provided" }, { status: 400 });
        }

        const score = calculateResumeScore(resumeText);
        return NextResponse.json({ success: true, scoreData: score });

    } catch (error) {
        console.error("Resume Score Error:", error);
        return NextResponse.json({ error: "Failed to score resume" }, { status: 500 });
    }
}

// ── Randomly pick one message from a pool ─────────────────────────────────────
function pick(options: string[]): string {
    return options[Math.floor(Math.random() * options.length)];
}

// ── Scoring weights (total = 100) ─────────────────────────────────────────────
// Parameters our AI specifically improves are weighted highest.
// A raw unoptimized resume should score ~40-55.
// An AI-optimized resume should score ~75-92.
// ─────────────────────────────────────────────────────────────────────────────

function calculateResumeScore(text: string) {
    // ── Pre-process text for robust matching ──────────────────────────────────
    // LaTeX PDFs may have ligatures, special chars, or encoding artifacts.
    // Normalize the text to handle these.
    const normalizedText = text
        .replace(/ﬁ/g, 'fi')
        .replace(/ﬂ/g, 'fl')
        .replace(/ﬀ/g, 'ff')
        .replace(/ﬃ/g, 'ffi')
        .replace(/ﬄ/g, 'ffl')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u2022/g, '•');     // Normalize Unicode bullets

    const lowerText = normalizedText.toLowerCase();
    const lines = normalizedText.split(/\n/).map(l => l.trim()).filter(Boolean);
    const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;

    // ── 1. Contact Info (10 pts) ──────────────────────────────────────────────
    const hasEmail     = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(normalizedText);
    const hasPhone     = /\d{10,}/.test(normalizedText.replace(/[\s\-().+]/g, ''));
    const hasLinkedIn  = /linkedin/i.test(lowerText);
    const hasGithub    = /github/i.test(lowerText);
    const hasPortfolio = /(portfolio|\.io|\.dev|\.me|\.site)/i.test(lowerText) && !hasLinkedIn && !hasGithub;

    const contactScore = Math.min(
        (hasEmail ? 3 : 0) + (hasPhone ? 3 : 0) + (hasLinkedIn ? 2 : 0) + ((hasGithub || hasPortfolio) ? 2 : 0),
        10
    );

    const missingContact: string[] = [];
    if (!hasLinkedIn) missingContact.push("LinkedIn");
    if (!hasGithub && !hasPortfolio) missingContact.push("GitHub/Portfolio");

    let contactFeedback: string;
    if (contactScore >= 10) {
        contactFeedback = pick([
            "All contact details present — email, phone, LinkedIn, and GitHub.",
            "Perfect contact section. Recruiters can reach you through every channel.",
            "Complete contact info detected. Email, phone, LinkedIn, and GitHub all found.",
            "Great — your contact section covers all the essentials.",
        ]);
    } else if (missingContact.length > 0) {
        contactFeedback = pick([
            `Add ${missingContact.join(" and ")} to your contact section.`,
            `Missing ${missingContact.join(" and ")} — include them so recruiters can find your work.`,
            `Your contact section is incomplete. Add ${missingContact.join(" and ")} for a stronger profile.`,
            `${missingContact.join(" and ")} not detected. Link them at the top of your resume.`,
        ]);
    } else {
        contactFeedback = pick([
            "Ensure your email and phone number are clearly visible.",
            "Double-check that your email and phone are present and formatted correctly.",
            "Email or phone may be missing — make sure both are easy to find.",
        ]);
    }

    // ── 2. Section Structure (10 pts) ─────────────────────────────────────────
    // Check for core section keywords — including common variations used in resume templates
    const sectionAliases: Record<string, string[]> = {
        experience: ['experience', 'work history', 'employment', 'professional experience', 'work experience'],
        education:  ['education', 'academic', 'university', 'degree', 'bachelor', 'master', 'b.tech', 'b.e.', 'b.sc', 'm.tech', 'gpa', 'cgpa'],
        skills:     ['skills', 'expertise', 'competencies', 'technical skills', 'core competencies', 'proficiencies', 'technologies'],
    };
    const bonusAliases: Record<string, string[]> = {
        projects:       ['project', 'projects', 'key projects', 'technical projects'],
        summary:        ['summary', 'objective', 'profile', 'about me', 'professional summary'],
        certifications: ['certification', 'certifications', 'certified'],
        achievements:   ['achievement', 'achievements', 'awards', 'honors', 'accomplishments'],
        publications:   ['publication', 'publications', 'research'],
    };

    const foundCore: string[] = [];
    for (const [section, aliases] of Object.entries(sectionAliases)) {
        if (aliases.some(alias => lowerText.includes(alias))) {
            foundCore.push(section);
        }
    }
    const foundBonus: string[] = [];
    for (const [section, aliases] of Object.entries(bonusAliases)) {
        if (aliases.some(alias => lowerText.includes(alias))) {
            foundBonus.push(section);
        }
    }

    // For freshers: Projects is a valid substitute for Experience
    // If "experience" is missing but "projects" is found, count it as a core section
    const hasProjects = foundBonus.includes('projects');
    const hasExperience = foundCore.includes('experience');
    if (!hasExperience && hasProjects) {
        foundCore.push('experience'); // Projects substitutes for Experience
    }

    const sectionScore  = Math.min((foundCore.length / 3) * 6 + Math.min(foundBonus.length, 2) * 2, 10);
    const missingSections = Object.keys(sectionAliases).filter(s => !foundCore.includes(s));

    let sectionFeedback: string;
    if (sectionScore >= 9) {
        sectionFeedback = pick([
            "All key sections present — great structure.",
            "Well-structured resume. All core and bonus sections detected.",
            "Solid layout — Experience/Projects, Education, Skills, and more are all present.",
            "Perfect section coverage. ATS parsers will have no trouble reading this.",
        ]);
    } else if (missingSections.length > 0) {
        sectionFeedback = pick([
            `Missing core sections: ${missingSections.join(", ")}. Add them for better ATS parsing.`,
            `ATS systems expect ${missingSections.join(", ")} — add these sections to improve parsing.`,
            `Your resume is missing: ${missingSections.join(", ")}. These are required by most ATS filters.`,
            `Add a ${missingSections.join(" and ")} section — recruiters and ATS both look for these.`,
        ]);
    } else {
        sectionFeedback = pick([
            `Found ${foundCore.length}/3 core sections. Add more relevant sections like Projects or Certifications.`,
            `Core sections look good. Consider adding Projects or Achievements to stand out.`,
            `Good base structure. Adding a Projects or Certifications section can boost your score further.`,
        ]);
    }

    // ── 3. Resume Length & Density (8 pts) ────────────────────────────────────
    let lengthScore = 0;
    let lengthFeedback = "";
    if (wordCount >= 350 && wordCount <= 800) {
        lengthScore = 8;
        lengthFeedback = pick([
            `Ideal length (${wordCount} words). Concise and complete.`,
            `Perfect — ${wordCount} words hits the sweet spot for a 1-page resume.`,
            `Great length at ${wordCount} words. Enough detail without overwhelming the reader.`,
            `${wordCount} words is exactly where you want to be. Tight and informative.`,
        ]);
    } else if (wordCount > 800 && wordCount <= 1100) {
        lengthScore = 5;
        lengthFeedback = pick([
            `Slightly long (${wordCount} words). Trim to under 800 for a tight 1-page resume.`,
            `At ${wordCount} words, this is a bit lengthy. Aim to cut it down to one tight page.`,
            `${wordCount} words — consider trimming older or less relevant bullets to tighten it up.`,
            `Just over the ideal range at ${wordCount} words. Remove filler phrases to get under 800.`,
        ]);
    } else if (wordCount >= 250 && wordCount < 350) {
        lengthScore = 5;
        lengthFeedback = pick([
            `Slightly brief (${wordCount} words). Add 1-2 more bullets per role to hit 350+.`,
            `At ${wordCount} words, add more detail. Expand your project descriptions and experience bullets.`,
            `${wordCount} words is a bit thin. Aim for 350+ to give recruiters enough to evaluate.`,
            `Your resume is close at ${wordCount} words. Flesh out your achievements to push it higher.`,
        ]);
    } else if (wordCount > 1100) {
        lengthScore = 3;
        lengthFeedback = pick([
            `Too long (${wordCount} words). Recruiters spend ~7 seconds — keep it to 1 page.`,
            `${wordCount} words is too much. Cut it down aggressively — one page is the standard.`,
            `Way over the ideal length at ${wordCount} words. Prioritize your last 3 years of experience.`,
            `At ${wordCount} words, this will likely be skimmed. Trim ruthlessly to under 800 words.`,
        ]);
    } else {
        lengthScore = 2;
        lengthFeedback = pick([
            `Very short (${wordCount} words). Add more detail to your experience and projects.`,
            `Only ${wordCount} words — expand your bullet points and descriptions for more substance.`,
            `${wordCount} words is brief. Add more context to your achievements — aim for 350+ words.`,
        ]);
    }

    // ── 4. Action Verbs (20 pts) ──────────────────────────────────────────────
    const strongVerbs = [
        "led", "developed", "created", "managed", "designed", "implemented", "optimized",
        "achieved", "improved", "increased", "decreased", "launched", "integrated",
        "collaborated", "pioneered", "engineered", "architected", "analyzed", "resolved",
        "built", "delivered", "deployed", "automated", "streamlined", "accelerated",
        "reduced", "generated", "spearheaded", "coordinated", "mentored", "scaled",
        "migrated", "refactored", "established", "transformed", "negotiated", "drove",
        "executed", "oversaw", "facilitated", "authored", "contributed", "shipped"
    ];
    const foundVerbs = strongVerbs.filter(v => new RegExp(`\\b${v}\\b`, 'i').test(normalizedText));
    const verbCount  = foundVerbs.length;
    const verbScore  = Math.min(Math.round((verbCount / 8) * 20), 20);

    let verbFeedback: string;
    if (verbScore >= 20) {
        verbFeedback = pick([
            `Excellent vocabulary — ${verbCount} strong action verbs detected.`,
            `Impressive — ${verbCount} power verbs found. Your bullets pack a punch.`,
            `${verbCount} action verbs is outstanding. Recruiters love this kind of energy.`,
            `Top marks — ${verbCount} strong openers like "Architected", "Deployed", and "Scaled" detected.`,
        ]);
    } else if (verbCount >= 5) {
        verbFeedback = pick([
            `${verbCount} action verbs found. Aim for 8+ (e.g., Architected, Deployed, Scaled).`,
            `Good start with ${verbCount} verbs. Push to 8+ by starting every bullet with a strong action word.`,
            `${verbCount} power verbs detected — you're close. Replace weak openers like "Worked on" with "Built" or "Led".`,
            `${verbCount} action verbs is decent. Each bullet should open with a verb like Delivered, Optimized, or Shipped.`,
        ]);
    } else {
        verbFeedback = pick([
            `Only ${verbCount} action verbs. Use strong openers: Led, Built, Optimized, Delivered.`,
            `${verbCount} action verbs is too few. Start every bullet with a power verb — never "Responsible for".`,
            `Weak verb usage (${verbCount} found). Replace passive language with: Engineered, Launched, Automated.`,
            `${verbCount} action verbs detected. Rewrite your bullets to open with impact words like Drove, Scaled, Shipped.`,
        ]);
    }

    // ── 5. Quantifiable Metrics (20 pts) ─────────────────────────────────────
    const metricPatterns = [
        /\d+\s*%/g,
        /\$\s*\d+[\d,.]*/g,
        /\d+\s*[xX]\s/g,
        /\d+\+\s/g,
        /\d[\d,]*\s*(users|customers|clients|engineers|teams?|members?|repos?|services?|endpoints?|requests?|transactions?|projects?)/gi,
        /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\b.*\b(teams?|engineers?|clients?|projects?)\b/gi,
        // Additional LaTeX-friendly metric patterns
        /\d+\s*ms/gi,                    // 480ms, 200 ms
        /\d+\s*(?:K|M|B)\b/g,           // 10K, 5M users
        /\d+\s*(?:seconds?|minutes?|hours?|days?)/gi,  // time savings
        /\b\d{2,}\b/g,                   // Any 2+ digit number (conservative metric detection)
    ];
    let metricCount = 0;
    metricPatterns.forEach(p => {
        const matches = normalizedText.match(p);
        if (matches) metricCount += matches.length;
    });
    metricCount = Math.min(metricCount, 20);
    const metricScore = Math.min(Math.round((metricCount / 5) * 20), 20);

    let metricFeedback: string;
    if (metricScore >= 20) {
        metricFeedback = pick([
            `Strong impact metrics — ${metricCount} quantified achievements detected.`,
            `Excellent — ${metricCount} data points found. Numbers make your impact undeniable.`,
            `${metricCount} metrics is impressive. Quantified results are what separate good resumes from great ones.`,
            `Outstanding use of numbers — ${metricCount} measurable outcomes detected throughout.`,
        ]);
    } else if (metricCount >= 3) {
        metricFeedback = pick([
            `${metricCount} metrics found. Add more numbers (%, $, user counts, time saved) to prove impact.`,
            `${metricCount} quantified results detected. Push to 5+ — every bullet should have a number if possible.`,
            `Good effort with ${metricCount} metrics. Add percentages, dollar amounts, or team sizes to strengthen bullets.`,
            `${metricCount} data points found. Quantify more: "improved performance" → "improved performance by 40%".`,
        ]);
    } else {
        metricFeedback = pick([
            `Only ${metricCount} quantified metrics. Numbers make bullets 40% more effective — add %, $, counts.`,
            `${metricCount} metrics is too few. Recruiters want proof — add numbers to every achievement.`,
            `Barely any metrics detected (${metricCount}). Transform vague bullets into data-driven statements.`,
            `${metricCount} quantified results found. Ask yourself: "How many? How much? How fast?" for each bullet.`,
        ]);
    }

    // ── 6. ATS Keyword Density (15 pts) ──────────────────────────────────────
    const atsKeywords = [
        "api", "rest", "graphql", "sql", "nosql", "cloud", "aws", "gcp", "azure",
        "docker", "kubernetes", "ci/cd", "devops", "agile", "scrum", "git",
        "machine learning", "deep learning", "data", "analytics", "microservices",
        "typescript", "javascript", "python", "java", "react", "node",
        "cross-functional", "stakeholder", "roadmap", "kpi", "roi", "p&l",
        "end-to-end", "full-stack", "scalable", "performance", "architecture",
        "strategy", "revenue", "growth", "pipeline", "sprint", "milestone",
    ];
    const foundKeywords = atsKeywords.filter(kw => lowerText.includes(kw));
    const kwCount = foundKeywords.length;
    const kwScore = Math.min(Math.round((kwCount / 10) * 15), 15);

    let kwFeedback: string;
    if (kwScore >= 15) {
        kwFeedback = pick([
            `Strong ATS keyword density — ${kwCount} industry keywords detected.`,
            `Excellent — ${kwCount} ATS keywords found. This resume will pass most automated filters.`,
            `${kwCount} relevant keywords detected. ATS systems will rank this resume highly.`,
            `Great keyword coverage with ${kwCount} terms. Your resume is well-optimized for automated screening.`,
        ]);
    } else if (kwCount >= 5) {
        kwFeedback = pick([
            `${kwCount} ATS keywords found. Add more role-specific terms from the job description.`,
            `${kwCount} keywords detected — aim for 10+. Mirror the language used in the job posting.`,
            `Decent keyword coverage (${kwCount}). Sprinkle in more JD-specific terms to pass ATS filters.`,
            `${kwCount} industry terms found. Copy key phrases from the job description to boost this score.`,
        ]);
    } else {
        kwFeedback = pick([
            `Low keyword density (${kwCount} found). ATS systems filter by keywords — use terms from the JD.`,
            `Only ${kwCount} ATS keywords detected. Without the right terms, your resume may never reach a human.`,
            `${kwCount} keywords is critically low. Tailor your resume to each job description to pass ATS screening.`,
            `ATS filters will likely reject this — only ${kwCount} relevant keywords found. Use the job description as a guide.`,
        ]);
    }

    // ── 7. Bullet Point Quality (10 pts) ──────────────────────────────────────
    // Detect bullets using multiple strategies:
    // 1. Lines starting with bullet characters (•, -, *, ▸, etc.)
    // 2. Lines starting with action verbs (common in LaTeX PDFs where bullet chars are lost)
    // 3. Short-to-medium lines that follow a section header pattern
    const bulletCharsRegex = /^[•\-\*▸▹◦·∙⁃‣►▪■□●○◆◇→⇒]/;
    const numberBulletRegex = /^\d+\./;
    const actionVerbStartRegex = new RegExp(
        `^(${strongVerbs.join('|')})\\b`,
        'i'
    );
    
    const bulletLines = lines.filter(l => {
        // Method 1: Traditional bullet character detection
        if (bulletCharsRegex.test(l) || numberBulletRegex.test(l)) return true;
        // Method 2: Lines starting with strong action verbs (15-40 words, typical bullet length)
        const wc = l.split(/\s+/).length;
        if (wc >= 8 && wc <= 40 && actionVerbStartRegex.test(l)) return true;
        return false;
    });

    const avgBulletLen = bulletLines.length > 0
        ? bulletLines.reduce((sum, b) => sum + b.split(/\s+/).length, 0) / bulletLines.length
        : 0;

    let bulletScore = 0;
    let bulletFeedback = "";
    if (bulletLines.length === 0) {
        bulletScore = 0;
        bulletFeedback = pick([
            "No bullet points detected. Use bullet points for experience and project descriptions.",
            "Bullet points are missing entirely. Structure your experience as 3-5 bullets per role.",
            "No bullets found — this makes your resume hard to skim. Add bullet points to every role.",
            "Recruiters scan, not read. Use bullet points to make your achievements instantly visible.",
        ]);
    } else if (bulletLines.length < 4) {
        bulletScore = 3;
        bulletFeedback = pick([
            `Only ${bulletLines.length} bullet points. Aim for 3-5 bullets per role.`,
            `${bulletLines.length} bullets is too few. Each position should have at least 3 achievement-focused points.`,
            `Sparse bullets (${bulletLines.length} total). Add more to give recruiters enough to evaluate.`,
            `${bulletLines.length} bullet points won't tell your story. Expand to 3-5 per role.`,
        ]);
    } else if (avgBulletLen < 8) {
        bulletScore = 5;
        bulletFeedback = pick([
            "Bullets are too short. Each should be 10-20 words with context and impact.",
            "Your bullet points are too brief. Add context — what did you do, how, and what was the result?",
            "Short bullets lack impact. Expand each to include the action, method, and outcome.",
            "Bullets average under 8 words — too terse. Aim for 10-20 words that show real impact.",
        ]);
    } else if (avgBulletLen > 35) {
        bulletScore = 5;
        bulletFeedback = pick([
            "Bullets are too long. Keep each to 1-2 lines — be concise and punchy.",
            "Your bullets read like paragraphs. Trim each to one tight, impactful sentence.",
            "Overly long bullets lose the reader. Cut each down to the essential action and result.",
            "Bullets averaging over 35 words are too wordy. Recruiters skim — make every word count.",
        ]);
    } else {
        bulletScore = 10;
        bulletFeedback = pick([
            `${bulletLines.length} well-structured bullets with good length (avg ${Math.round(avgBulletLen)} words).`,
            `Great bullet structure — ${bulletLines.length} points at an ideal average of ${Math.round(avgBulletLen)} words each.`,
            `Solid bullets — ${bulletLines.length} entries, well-sized and easy to scan.`,
            `Bullet points look great. ${bulletLines.length} entries at ${Math.round(avgBulletLen)} words avg — perfect for recruiters.`,
        ]);
    }

    // ── 8. Summary / Objective Quality (7 pts) ────────────────────────────────
    const summaryAliases = ['summary', 'objective', 'profile', 'about me', 'professional summary', 'career summary'];
    const hasSummary = summaryAliases.some(alias => lowerText.includes(alias));
    
    // Also check for summary-like content: 2-3 sentence paragraph near the top of the resume
    // (some templates render summary without a labeled section header)
    const topText = normalizedText.slice(0, Math.min(normalizedText.length, 800));
    const topSentences = (topText.match(/[.!?]+/g) || []).length;
    const hasImplicitSummary = !hasSummary && topSentences >= 2 && topText.split(/\s+/).length > 30;
    
    let summaryScore = 0;
    let summaryFeedback = "";
    if (hasSummary || hasImplicitSummary) {
        const sentenceCount = (topText.match(/[.!?]+/g) || []).length;
        if (sentenceCount < 2 && !hasImplicitSummary) {
            summaryScore = 3;
            summaryFeedback = pick([
                "Summary is too brief. Write 2-3 sentences pitching your value for the target role.",
                "Your summary needs more substance. Expand it to 2-3 sentences that highlight your key strengths.",
                "One-liner summaries don't cut it. Write 2-3 sentences that make a recruiter want to read on.",
                "Summary detected but it's too short. Flesh it out — mention your role, years of experience, and top skill.",
            ]);
        } else {
            summaryScore = 7;
            summaryFeedback = pick([
                "Professional summary present — good for ATS and recruiter first impressions.",
                "Strong summary section detected. This is the first thing recruiters read — great that it's there.",
                "Summary looks solid. A well-written opener significantly improves your callback rate.",
                "Good — your summary sets the stage. Make sure it's tailored to the specific role you're applying for.",
            ]);
        }
    } else {
        summaryScore = 0;
        summaryFeedback = pick([
            "No summary section found. A 2-3 sentence professional summary boosts ATS score significantly.",
            "Missing a summary. Add a 2-3 sentence pitch at the top — it's the first thing recruiters read.",
            "No professional summary detected. A strong opener sets the tone and hooks the recruiter immediately.",
            "Add a Summary section. 2-3 sentences at the top telling recruiters exactly who you are and what you offer.",
        ]);
    }

    // ── Total ─────────────────────────────────────────────────────────────────
    const totalScore = Math.min(
        Math.round(contactScore + sectionScore + lengthScore + verbScore + metricScore + kwScore + bulletScore + summaryScore),
        100
    );

    // ── Grade label ───────────────────────────────────────────────────────────
    let grade = "";
    if      (totalScore >= 88) grade = "A+  — Recruiter-Ready";
    else if (totalScore >= 78) grade = "A   — Strong Resume";
    else if (totalScore >= 65) grade = "B   — Good, Needs Polish";
    else if (totalScore >= 50) grade = "C   — Average — Optimize with AI";
    else                       grade = "D   — Needs Significant Work";

    return {
        totalScore,
        grade,
        categories: [
            { name: "Action Verbs",      score: verbScore,    max: 20, feedback: verbFeedback },
            { name: "Impact Metrics",    score: metricScore,  max: 20, feedback: metricFeedback },
            { name: "ATS Keywords",      score: kwScore,      max: 15, feedback: kwFeedback },
            { name: "Contact Info",      score: contactScore, max: 10, feedback: contactFeedback },
            { name: "Section Structure", score: sectionScore, max: 10, feedback: sectionFeedback },
            { name: "Bullet Quality",    score: bulletScore,  max: 10, feedback: bulletFeedback },
            { name: "Resume Length",     score: lengthScore,  max: 8,  feedback: lengthFeedback },
            { name: "Summary",           score: summaryScore, max: 7,  feedback: summaryFeedback },
        ]
    };
}
