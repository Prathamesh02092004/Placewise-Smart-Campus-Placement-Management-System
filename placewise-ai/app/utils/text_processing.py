import re
from typing import Optional

# Alias table — maps common variations to canonical skill names
SKILL_ALIASES: dict[str, str] = {
    "reactjs": "React.js",
    "react js": "React.js",
    "react.js": "React.js",
    "nodejs": "Node.js",
    "node js": "Node.js",
    "node.js": "Node.js",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "python3": "Python",
    "py": "Python",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "dl": "Deep Learning",
    "nlp": "Natural Language Processing",
    "cv": "Computer Vision",
    "k8s": "Kubernetes",
    "docker compose": "Docker",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis cache": "Redis",
    "git hub": "Git",
    "github": "Git",
    "gitlab": "Git",
    "rest": "REST API",
    "rest api": "REST API",
    "restful": "REST API",
    "restful api": "REST API",
    "graphql api": "GraphQL",
    "aws cloud": "AWS",
    "amazon aws": "AWS",
    "gcp": "Google Cloud",
    "google cloud platform": "Google Cloud",
    "microsoft azure": "Azure",
    "ci cd": "CI/CD",
    "cicd": "CI/CD",
    "jenkins ci": "Jenkins",
    "github actions": "CI/CD",
    "oop": "Object-Oriented Programming",
    "object oriented": "Object-Oriented Programming",
    "dsa": "Data Structures & Algorithms",
    "data structures and algorithms": "Data Structures & Algorithms",
    "system design": "System Design",
    "sql": "SQL",
    "nosql": "NoSQL",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "django rest": "Django",
    "flask api": "Flask",
    "c sharp": "C#",
    "c++": "C++",
    "cplusplus": "C++",
    "golang": "Go",
    "rust lang": "Rust",
    "linux bash": "Linux",
    "shell scripting": "Linux",
    "bash scripting": "Linux",
    "terraform iac": "Terraform",
    "ansible automation": "Ansible",
    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "tensorflow 2": "TensorFlow",
    "pytorch": "PyTorch",
    "pandas dataframe": "Pandas",
    "numpy array": "NumPy",
    "tableau desktop": "Tableau",
    "power bi desktop": "Power BI",
    "figma design": "Figma",
    "adobe xd": "Adobe XD",
    "jira software": "Jira",
    "agile scrum": "Agile",
    "scrum methodology": "Agile",
}

# Depth-signalling verbs — used for proficiency estimation
DEEP_VERBS     = {"architected", "designed", "led", "built", "deployed",
                  "optimised", "optimized", "implemented", "developed",
                  "created", "engineered", "scaled", "maintained", "owned"}
MEDIUM_VERBS   = {"used", "worked", "utilised", "utilized", "applied",
                  "integrated", "configured", "managed", "handled"}
SURFACE_VERBS  = {"familiar", "exposure", "knowledge", "understanding",
                  "learning", "studied", "explored", "aware"}


def normalise_skill(raw: str) -> str:
    """
    Lower-cases, strips whitespace, resolves alias, and title-cases the result.
    Returns the canonical skill name or the original (title-cased) if not found.
    """
    cleaned = raw.strip().lower()
    # Remove trailing punctuation
    cleaned = re.sub(r"[^\w\s.#+]", "", cleaned).strip()
    canonical = SKILL_ALIASES.get(cleaned)
    if canonical:
        return canonical
    # Try partial match — if "react" is in aliases resolve it
    for alias, canon in SKILL_ALIASES.items():
        if cleaned == alias:
            return canon
    # Title-case multi-word, preserve acronyms
    return raw.strip()


def normalise_skill_list(skills: list[str]) -> list[str]:
    """Normalise a list and deduplicate while preserving order."""
    seen: set[str] = set()
    result: list[str] = []
    for s in skills:
        normed = normalise_skill(s)
        key = normed.lower()
        if key not in seen and normed:
            seen.add(key)
            result.append(normed)
    return result


def clean_text(text: str) -> str:
    """Remove non-printable characters and normalise whitespace."""
    text = re.sub(r"[^\x20-\x7E\n\t]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_email(text: str) -> str:
    match = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    match = re.search(r"(?:\+91[\s\-]?)?[6-9]\d{9}", text)
    return match.group(0) if match else ""


def extract_cgpa(text: str) -> Optional[float]:
    """Extract CGPA — looks for patterns like '8.5/10', 'CGPA: 8.5', 'GPA 3.8'."""
    patterns = [
        r"(?:cgpa|gpa|cpi)[:\s]*(\d+\.?\d*)\s*(?:/\s*(?:10|4))?",
        r"(\d+\.\d+)\s*/\s*10",
        r"(\d+\.\d+)\s*(?:cgpa|gpa)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = float(m.group(1))
            if val > 10:
                val = val / 10  # might be on 100-point scale
            if 0 <= val <= 10:
                return round(val, 2)
    return None