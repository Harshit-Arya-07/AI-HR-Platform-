from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class RecommendationType(str, Enum):
    STRONG_MATCH = "STRONG_MATCH"
    GOOD_MATCH = "GOOD_MATCH"
    MODERATE_MATCH = "MODERATE_MATCH"
    WEAK_MATCH = "WEAK_MATCH"
    NO_MATCH = "NO_MATCH"

class ScoreRequest(BaseModel):
    resume_text: str = Field(..., description="Resume content as text")
    job_description: str = Field(..., description="Job description content")
    job_requirements: List[str] = Field(default=[], description="List of required skills/qualifications")
    
    class Config:
        schema_extra = {
            "example": {
                "resume_text": "John Doe, Software Engineer with 5 years experience in Python, Django, and JavaScript...",
                "job_description": "We are looking for a Senior Python Developer with experience in web development...",
                "job_requirements": ["Python", "Django", "AWS", "Docker", "JavaScript"]
            }
        }

class ParseResumeRequest(BaseModel):
    resume_text: str = Field(..., description="Resume content as text")
    
    class Config:
        schema_extra = {
            "example": {
                "resume_text": "John Doe\nSoftware Engineer\nEmail: john@example.com\nPhone: +1-555-0123..."
            }
        }

class GenerateQuestionsRequest(BaseModel):
    candidate_profile: Dict[str, Any] = Field(..., description="Candidate profile data")
    job_description: str = Field(..., description="Job description")
    focus_areas: Optional[List[str]] = Field(default=None, description="Specific areas to focus questions on")
    
    class Config:
        schema_extra = {
            "example": {
                "candidate_profile": {
                    "skills": ["Python", "Django", "JavaScript"],
                    "experience_years": 5,
                    "roles": ["Software Engineer", "Backend Developer"]
                },
                "job_description": "Senior Python Developer position...",
                "focus_areas": ["technical_skills", "problem_solving"]
            }
        }

class ScoreBreakdown(BaseModel):
    skill_overlap: float = Field(..., ge=0.0, le=1.0, description="Skill overlap score (0-1)")
    semantic_similarity: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity score (0-1)")
    role_relevance: float = Field(..., ge=0.0, le=1.0, description="Role relevance score (0-1)")
    seniority_match: float = Field(..., ge=0.0, le=1.0, description="Seniority match score (0-1)")

class ExtractedProfile(BaseModel):
    name: Optional[str] = Field(None, description="Candidate name")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    skills: List[str] = Field(default=[], description="Extracted skills")
    experience_years: Optional[int] = Field(None, description="Years of experience")
    education: List[str] = Field(default=[], description="Education details")
    roles: List[str] = Field(default=[], description="Previous roles/positions")
    companies: List[str] = Field(default=[], description="Previous companies")

class ScoreResponse(BaseModel):
    candidate_id: Optional[str] = Field(None, description="Generated candidate ID")
    overall_score: float = Field(..., ge=0.0, le=10.0, description="Overall match score (0-10)")
    score_breakdown: ScoreBreakdown = Field(..., description="Detailed score breakdown")
    extracted_skills: List[str] = Field(default=[], description="Skills found in resume")
    missing_skills: List[str] = Field(default=[], description="Required skills not found")
    summary: str = Field(..., description="AI-generated candidate summary")
    interview_questions: List[str] = Field(default=[], description="Generated interview questions")
    recommendation: RecommendationType = Field(..., description="Overall recommendation")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence")

class ParseResponse(BaseModel):
    profile: ExtractedProfile = Field(..., description="Extracted candidate profile")
    raw_sections: Dict[str, str] = Field(default={}, description="Raw extracted sections")
    processing_time: float = Field(..., description="Processing time in seconds")

class QuestionResponse(BaseModel):
    questions: List[str] = Field(..., description="Generated interview questions")
    question_categories: Dict[str, List[str]] = Field(default={}, description="Questions grouped by category")
    difficulty_levels: Dict[str, str] = Field(default={}, description="Difficulty level for each question")
    estimated_duration: int = Field(..., description="Estimated interview duration in minutes")

class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status")
    timestamp: str = Field(..., description="Current timestamp")
    version: str = Field(..., description="Service version")
    models_loaded: bool = Field(..., description="Whether ML models are loaded")
    uptime: float = Field(..., description="Service uptime in seconds")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")