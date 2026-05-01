"""
Resume parsing pipeline.
1. Extract raw text from PDF bytes using pdfminer.six
2. Segment text into sections (Skills, Experience, Education, etc.)
3. Extract structured fields using regex and spaCy NER
4. Score skills by mention context (depth verb analysis)
"""
import re
import io
import logging
from typing import Optional

from pdfminer.high_level import extract_text as pdf_extract_text
from app.schemas.resume import ResumeData, SkillSignal, EducationEntry, ExperienceEntry
from app.utils.text_processing import (
    clean_text, extract_email, extract_phone, extract_cgpa,
    normalise_skill, DEEP_VERBS, MEDIUM_VERBS, SURFACE_VERBS,
)
from app.utils.skill_taxonomy import load_taxonomy

logger = logging.getLogger(__name__)

# Section header patterns — order matters (more specific first)
SECTION_PATTERNS = [
    (r"(?:technical\s+)?skills?|technologies|tech\s+stack|core\s+competencies", "skills"),
    (r"work\s+experience|professional\s+experience|employment|experience", "experience"),
    (r"education|academic|qualification", "education"),
    (r"projects?|personal\s+projects?|academic\s+projects?", "projects"),
    (r"certifications?|certificates?|courses?|training", "certifications"),
    (r"summary|objective|profile|about\s+me", "summary"),
    (r"internship|internships?|industrial\s+training", "internships"),
    (r"achievements?|awards?|honours?", "achievements"),
    (r"publications?|research|papers?", "research"),
]

_NLP = None


def _get_nlp():
    """Lazy-load spaCy model to avoid import-time cost."""
    global _NLP
    if _NLP is None:
        try:
            import spacy
            from app.config import get_settings
            _NLP = spacy.load(get_settings().spacy_model)
            logger.info("spaCy model loaded.")
        except Exception as e:
            logger.warning(f"spaCy load failed: {e}. NER disabled.")
            _NLP = None
    return _NLP


def extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract raw text from PDF bytes. Returns empty string on failure."""
    try:
        return clean_text(pdf_extract_text(io.BytesIO(pdf_bytes)))
    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        return ""


def _segment_text(text: str) -> dict[str, str]:
    """
    Split resume text into named sections.
    Returns a dict mapping section_name → section_text.
    """
    lines = text.split("\n")
    sections: dict[str, list[str]] = {"header": []}
    current = "header"

    for line in lines:
        stripped = line.strip()
        matched = False
        for pattern, section_name in SECTION_PATTERNS:
            if re.match(r"^\s*" + pattern + r"\s*[:\-]?\s*$", stripped, re.IGNORECASE):
                current = section_name
                sections.setdefault(current, [])
                matched = True
                break
        if not matched:
            sections.setdefault(current, []).append(stripped)

    return {k: " ".join(v).strip() for k, v in sections.items()}


def _extract_skills_from_text(text: str) -> list[SkillSignal]:
    """
    Match skill mentions against taxonomy using keyword matching.
    Estimate proficiency from verb context depth signals.
    """
    taxonomy = load_taxonomy()
    if not taxonomy:
        return []

    text_lower = text.lower()
    results: list[SkillSignal] = []

    for entry in taxonomy:
        skill_name = entry["skill_name"]
        aliases = [skill_name.lower()] + [a.lower() for a in (entry.get("aliases") or [])]

        found = False
        for alias in aliases:
            if alias in text_lower:
                found = True
                break

        if not found:
            continue

        # Count mentions across all text
        mention_count = sum(
            len(re.findall(re.escape(alias), text_lower))
            for alias in aliases
        )

        # Frequency score (0–40)
        import math
        freq_score = min(40, math.log(mention_count + 1, 2) * 13)

        # Depth score — look for context verbs near the skill mention
        depth_score = 0.0
        window = 60  # characters around each mention
        for alias in aliases:
            for m in re.finditer(re.escape(alias), text_lower):
                start = max(0, m.start() - window)
                ctx = text_lower[start: m.end() + window]
                words = set(ctx.split())
                if words & DEEP_VERBS:
                    depth_score = max(depth_score, 30.0)
                elif words & MEDIUM_VERBS:
                    depth_score = max(depth_score, 20.0)
                elif words & SURFACE_VERBS:
                    depth_score = max(depth_score, 5.0)
                else:
                    depth_score = max(depth_score, 15.0)  # just mentioned

        # Recency: skills section vs body text
        skills_text = _segment_text(text).get("skills", "")
        recency_score = 30.0 if any(alias in skills_text.lower() for alias in aliases) else 15.0

        proficiency = min(100.0, round(freq_score + depth_score + recency_score, 1))
        results.append(SkillSignal(skill_name=skill_name, proficiency_signal=proficiency))

    # Sort by proficiency descending
    results.sort(key=lambda x: x.proficiency_signal, reverse=True)
    return results


def _extract_name(text: str) -> str:
    """
    Try spaCy PERSON entity first.
    Fallback: first non-empty line that looks like a name.
    """
    nlp = _get_nlp()
    if nlp:
        try:
            doc = nlp(text[:500])  # only scan the top portion
            for ent in doc.ents:
                if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
                    return ent.text.strip()
        except Exception:
            pass

    # Fallback: first short line with only letters and spaces
    for line in text.split("\n")[:10]:
        stripped = line.strip()
        if 2 < len(stripped) < 50 and re.match(r"^[A-Za-z\s\.]+$", stripped):
            return stripped
    return ""


def _extract_education(text: str) -> list[EducationEntry]:
    """Extract education entries from the education section."""
    sections = _segment_text(text)
    edu_text = sections.get("education", "")
    entries = []

    degree_patterns = [
        r"(B\.?E\.?|B\.?Tech\.?|M\.?E\.?|M\.?Tech\.?|B\.?Sc\.?|M\.?Sc\.?|BCA|MCA|MBA|PhD)",
    ]
    institution_patterns = [
        r"([A-Z][a-zA-Z\s]+(?:University|Institute|College|School|IIT|NIT|IIIT)[a-zA-Z\s,]*)",
    ]

    for pat in degree_patterns:
        for m in re.finditer(pat, edu_text, re.IGNORECASE):
            entries.append(EducationEntry(degree=m.group(1)))

    # Try to match institution names
    for pat in institution_patterns:
        for i, m in enumerate(re.finditer(pat, edu_text)):
            if i < len(entries):
                entries[i].institution = m.group(1).strip()
            else:
                entries.append(EducationEntry(institution=m.group(1).strip()))

    return entries[:4]  # cap at 4 entries


def _extract_experience(text: str) -> list[ExperienceEntry]:
    """Extract work experience entries."""
    sections = _segment_text(text)
    exp_text = sections.get("experience", "") + " " + sections.get("internships", "")

    entries = []
    # Split on year patterns that typically start a new entry
    blocks = re.split(r"\b(20\d{2})\b", exp_text)

    companies = re.findall(
        r"(?:at|@|,)\s+([A-Z][a-zA-Z\s]+(?:Pvt|Ltd|Inc|Corp|Technologies|Solutions|Systems|Labs)?\.?)",
        exp_text,
        re.IGNORECASE
    )
    roles = re.findall(
        r"((?:Software|Data|DevOps|ML|AI|Backend|Frontend|Full[- ]Stack|Cloud|Product|"
        r"Research|QA|Test)\s+(?:Engineer|Developer|Intern|Analyst|Scientist|Manager))",
        exp_text,
        re.IGNORECASE
    )

    for i in range(max(len(companies), len(roles))):
        entries.append(ExperienceEntry(
            company=companies[i].strip() if i < len(companies) else "",
            role=roles[i].strip() if i < len(roles) else "",
        ))

    return entries[:5]


def parse_resume(pdf_bytes: bytes) -> ResumeData:
    """
    Full parsing pipeline. Returns a ResumeData object.
    Called by POST /ai/resume/parse.
    """
    text = extract_pdf_text(pdf_bytes)
    if not text:
        return ResumeData()

    skills   = _extract_skills_from_text(text)
    name     = _extract_name(text)
    email    = extract_email(text)
    phone    = extract_phone(text)
    edu      = _extract_education(text)
    exp      = _extract_experience(text)

    sections = _segment_text(text)
    certs    = [
        c.strip()
        for c in re.split(r"[,;\n•]", sections.get("certifications", ""))
        if len(c.strip()) > 3
    ][:10]

    projects = [
        p.strip()
        for p in re.split(r"\n\n|\n•|\n-", sections.get("projects", ""))
        if len(p.strip()) > 10
    ][:8]

    logger.info(f"Parsed resume: name={name!r}, skills={len(skills)}, email={email!r}")

    return ResumeData(
        name=name,
        email=email,
        phone=phone,
        skills=skills,
        education=edu,
        experience=exp,
        certifications=certs,
        projects=projects,
        raw_text=text[:3000],  # truncate to save memory
    )