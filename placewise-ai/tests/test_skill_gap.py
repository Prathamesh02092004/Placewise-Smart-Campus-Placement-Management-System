import pytest
from app.schemas.skill_gap import SkillGapRequest
from app.services.skill_gap_analyzer import analyze_gap


def _make_request(**kwargs):
    defaults = dict(
        student_id="stu-001",
        job_id="job-001",
        role_category="software_engineer",
        student_skills=[],
        job_skills=["Python", "React.js", "Docker", "SQL", "Git"],
        student_cgpa=8.0,
        student_branch="Computer Engineering",
        resume_text="",
    )
    defaults.update(kwargs)
    return SkillGapRequest(**defaults)


def test_no_matching_skills_is_critical():
    req    = _make_request(student_skills=[])
    result = analyze_gap(req)
    assert result.severity == "critical"
    assert result.overall_match < 30


def test_all_skills_matching_is_ready_or_moderate():
    req    = _make_request(student_skills=["Python", "React.js", "Docker", "SQL", "Git",
                                            "Data Structures & Algorithms", "System Design",
                                            "REST API", "Object-Oriented Programming"])
    result = analyze_gap(req)
    assert result.severity in ("ready", "moderate")
    assert result.overall_match >= 60


def test_alias_normalisation_prevents_false_gap():
    req    = _make_request(
        student_skills=["ReactJS", "nodejs", "ML"],
        job_skills=["React.js", "Node.js", "Machine Learning"],
    )
    result = analyze_gap(req)
    # After normalisation ReactJS == React.js etc. → should not be in missing
    missing_names = [s.skill_name for s in result.missing_skills]
    assert "React.js" not in missing_names


def test_response_structure():
    req    = _make_request(student_skills=["Python", "Git"])
    result = analyze_gap(req)
    assert 0 <= result.overall_match <= 100
    assert result.severity in ("critical", "moderate", "ready")
    assert isinstance(result.missing_skills, list)
    assert isinstance(result.weak_skills, list)
    assert isinstance(result.market_demand, list)
    assert isinstance(result.learning_path, list)


def test_learning_path_ordered():
    req    = _make_request(student_skills=[])
    result = analyze_gap(req)
    orders = [step.order for step in result.learning_path]
    assert orders == sorted(orders)