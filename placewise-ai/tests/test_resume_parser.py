import pytest
from app.services.resume_parser import _segment_text, _extract_skills_from_text
from app.utils.text_processing import normalise_skill, extract_email, extract_cgpa


def test_normalise_skill_alias():
    assert normalise_skill("ReactJS") == "React.js"
    assert normalise_skill("k8s") == "Kubernetes"
    assert normalise_skill("ML") == "Machine Learning"
    assert normalise_skill("nodejs") == "Node.js"


def test_extract_email():
    assert extract_email("Contact me at john@example.com for more") == "john@example.com"
    assert extract_email("No email here") == ""


def test_extract_cgpa():
    assert extract_cgpa("CGPA: 8.5/10") == 8.5
    assert extract_cgpa("GPA 3.8") == 3.8
    assert extract_cgpa("No CGPA") is None


def test_segment_text_finds_sections():
    text = "John Doe\njohn@example.com\n\nSkills\nPython React.js\n\nExperience\nSoftware Intern at Google"
    sections = _segment_text(text)
    assert "skills" in sections
    assert "experience" in sections
    assert "Python" in sections["skills"] or "python" in sections["skills"].lower()


def test_skill_extraction_returns_list():
    text = "I have experience with Python, React.js, Docker, and SQL. I architected a REST API."
    skills = _extract_skills_from_text(text)
    assert isinstance(skills, list)
    skill_names = [s.skill_name for s in skills]
    assert any("Python" in n for n in skill_names)