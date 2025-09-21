import pytest
import asyncio
from unittest.mock import Mock, patch
from app.models.ml_models import MLModels
from app.models.schemas import ScoreRequest, RecommendationType

@pytest.fixture
def ml_models():
    """Create ML models instance for testing"""
    models = MLModels()
    # Mock initialization to avoid loading heavy models in tests
    models.is_initialized = True
    models.tfidf_vectorizer = Mock()
    models.scoring_pipeline = Mock()
    return models

@pytest.mark.asyncio
async def test_parse_resume(ml_models):
    """Test resume parsing functionality"""
    resume_text = """
    John Doe
    Software Engineer
    john@example.com
    (555) 123-4567
    
    Experience:
    5 years of experience in Python development
    
    Skills:
    Python, Django, JavaScript, React
    
    Education:
    Bachelor's Degree in Computer Science
    """
    
    result = await ml_models.parse_resume(resume_text)
    
    assert result.profile.name == "John Doe"
    assert result.profile.email == "john@example.com"
    assert result.profile.phone == "(555) 123-4567"
    assert "Python" in result.profile.skills
    assert result.profile.experience_years == 5
    assert len(result.profile.education) > 0

def test_skill_overlap_calculation(ml_models):
    """Test skill overlap calculation"""
    resume_skills = ["Python", "Django", "JavaScript"]
    job_requirements = ["Python", "Django", "AWS", "Docker"]
    
    overlap = ml_models._calculate_skill_overlap(resume_skills, job_requirements)
    
    # Should be 2/4 = 0.5 (2 matching skills out of 4 requirements)
    assert overlap == 0.5

def test_seniority_match_calculation(ml_models):
    """Test seniority matching logic"""
    # Test senior level job with appropriate experience
    job_description = "We are looking for a Senior Python Developer..."
    experience_years = 6
    
    match = ml_models._calculate_seniority_match(experience_years, job_description)
    
    # Should be high match for senior role with 6 years experience
    assert match >= 0.8

def test_recommendation_generation(ml_models):
    """Test recommendation logic"""
    # High score should give STRONG_MATCH
    high_score = 8.5
    recommendation = ml_models._get_recommendation(high_score)
    assert recommendation == RecommendationType.STRONG_MATCH
    
    # Low score should give NO_MATCH
    low_score = 2.0
    recommendation = ml_models._get_recommendation(low_score)
    assert recommendation == RecommendationType.NO_MATCH

@pytest.mark.asyncio
async def test_score_resume_integration(ml_models):
    """Test complete resume scoring workflow"""
    resume_text = "John Doe, Senior Python Developer with 5 years experience in Django and React"
    job_description = "Looking for a Senior Python Developer with Django experience"
    job_requirements = ["Python", "Django"]
    
    # Mock TF-IDF similarity
    ml_models.tfidf_vectorizer.fit_transform.return_value = Mock()
    with patch('app.models.ml_models.cosine_similarity', return_value=[[0.8]]):
        result = await ml_models.score_resume(resume_text, job_description, job_requirements)
    
    assert result.overall_score > 0
    assert result.recommendation in [r.value for r in RecommendationType]
    assert len(result.extracted_skills) > 0
    assert len(result.interview_questions) > 0

def test_health_status(ml_models):
    """Test health status endpoint"""
    status = ml_models.get_health_status()
    
    assert "status" in status
    assert "timestamp" in status
    assert "version" in status
    assert status["models_loaded"] == True

if __name__ == "__main__":
    pytest.main([__file__])