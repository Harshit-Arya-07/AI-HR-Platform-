import pickle
import re
import time
import uuid
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from loguru import logger
import spacy
import nltk
from textblob import TextBlob

from app.models.schemas import (
    ExtractedProfile, ScoreBreakdown, RecommendationType,
    ScoreResponse, ParseResponse, QuestionResponse
)

class MLModels:
    """Main ML models class for HR automation"""
    
    def __init__(self):
        self.tfidf_vectorizer = None
        self.scoring_pipeline = None
        self.nlp_model = None
        self.skill_keywords = None
        self.role_keywords = None
        self.is_initialized = False
        self.startup_time = time.time()
        
    async def initialize(self):
        """Initialize all ML models and components"""
        try:
            logger.info("Initializing ML models...")
            
            # Download required NLTK data
            try:
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
                nltk.download('vader_lexicon', quiet=True)
            except Exception as e:
                logger.warning(f"NLTK download failed: {e}")
            
            # Initialize TF-IDF vectorizer
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=5000,
                stop_words='english',
                ngram_range=(1, 2),
                lowercase=True
            )
            
            # Initialize NLP model (using spaCy)
            try:
                self.nlp_model = spacy.load("en_core_web_sm")
            except OSError:
                logger.warning("spaCy model not found, using basic NLP")
                self.nlp_model = None
            
            # Initialize skill and role keywords
            self._initialize_keywords()
            
            # Initialize scoring pipeline
            self._initialize_scoring_pipeline()
            
            self.is_initialized = True
            logger.info("ML models initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize ML models: {e}")
            raise
    
    def _initialize_keywords(self):
        """Initialize skill and role keyword dictionaries"""
        self.skill_keywords = {
            'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy'],
            'javascript': ['javascript', 'js', 'node.js', 'react', 'angular', 'vue', 'typescript'],
            'java': ['java', 'spring', 'hibernate', 'maven', 'gradle'],
            'web': ['html', 'css', 'sass', 'less', 'bootstrap', 'tailwind'],
            'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch'],
            'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'],
            'data': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn'],
            'mobile': ['android', 'ios', 'react native', 'flutter', 'swift', 'kotlin'],
            'devops': ['ci/cd', 'jenkins', 'github actions', 'docker', 'kubernetes', 'ansible']
        }
        
        self.role_keywords = {
            'senior': ['senior', 'lead', 'principal', 'architect', 'manager'],
            'mid': ['developer', 'engineer', 'analyst', 'specialist'],
            'junior': ['junior', 'entry', 'associate', 'trainee', 'intern']
        }
    
    def _initialize_scoring_pipeline(self):
        """Initialize the scoring pipeline"""
        # Simple pipeline for demonstration
        self.scoring_pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
        ])
        
        # Generate dummy training data for initialization
        X_dummy = np.random.rand(100, 10)  # 10 features
        y_dummy = np.random.randint(0, 2, 100)  # Binary classification
        
        self.scoring_pipeline.fit(X_dummy, y_dummy)
    
    async def parse_resume(self, resume_text: str) -> ParseResponse:
        """Extract structured information from resume text"""
        start_time = time.time()
        
        try:
            profile = self._extract_profile(resume_text)
            raw_sections = self._extract_sections(resume_text)
            
            processing_time = time.time() - start_time
            
            return ParseResponse(
                profile=profile,
                raw_sections=raw_sections,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Resume parsing failed: {e}")
            raise
    
    def _extract_profile(self, text: str) -> ExtractedProfile:
        """Extract candidate profile information"""
        text_lower = text.lower()
        
        # Extract name (first line often contains name)
        lines = text.strip().split('\n')
        name = None
        if lines:
            # Simple heuristic: first non-empty line with letters
            for line in lines[:3]:
                line = line.strip()
                if line and any(c.isalpha() for c in line) and len(line.split()) <= 4:
                    name = line
                    break
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, text)
        email = email_match.group() if email_match else None
        
        # Extract phone
        phone_patterns = [
            r'\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\(\d{3}\)[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'
        ]
        phone = None
        for pattern in phone_patterns:
            phone_match = re.search(pattern, text)
            if phone_match:
                phone = phone_match.group()
                break
        
        # Extract skills
        skills = self._extract_skills(text_lower)
        
        # Extract experience years
        experience_years = self._extract_experience_years(text_lower)
        
        # Extract education
        education = self._extract_education(text)
        
        # Extract roles
        roles = self._extract_roles(text_lower)
        
        # Extract companies
        companies = self._extract_companies(text)
        
        return ExtractedProfile(
            name=name,
            email=email,
            phone=phone,
            skills=skills,
            experience_years=experience_years,
            education=education,
            roles=roles,
            companies=companies
        )
    
    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume text"""
        found_skills = []
        
        for category, keywords in self.skill_keywords.items():
            for skill in keywords:
                if skill in text:
                    found_skills.append(skill.title())
        
        # Remove duplicates while preserving order
        seen = set()
        unique_skills = []
        for skill in found_skills:
            if skill.lower() not in seen:
                seen.add(skill.lower())
                unique_skills.append(skill)
        
        return unique_skills[:20]  # Limit to top 20 skills
    
    def _extract_experience_years(self, text: str) -> Optional[int]:
        """Extract years of experience from resume"""
        experience_patterns = [
            r'(\d+)\+?\s*years?\s*of\s*experience',
            r'(\d+)\+?\s*years?\s*experience',
            r'experience\s*:?\s*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*yrs?\s*experience'
        ]
        
        for pattern in experience_patterns:
            match = re.search(pattern, text)
            if match:
                return int(match.group(1))
        
        return None
    
    def _extract_education(self, text: str) -> List[str]:
        """Extract education information"""
        education_keywords = [
            'bachelor', 'master', 'phd', 'doctorate', 'mba', 'degree',
            'university', 'college', 'institute', 'school'
        ]
        
        education = []
        lines = text.split('\n')
        
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in education_keywords):
                education.append(line.strip())
        
        return education[:5]  # Limit to 5 entries
    
    def _extract_roles(self, text: str) -> List[str]:
        """Extract job roles/titles from resume"""
        role_patterns = [
            r'(software engineer|developer|programmer|architect)',
            r'(data scientist|analyst|researcher)',
            r'(manager|lead|director|supervisor)',
            r'(consultant|specialist|expert)',
            r'(designer|admin|coordinator)'
        ]
        
        roles = []
        for pattern in role_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                roles.append(match.title())
        
        # Remove duplicates
        return list(set(roles))[:10]
    
    def _extract_companies(self, text: str) -> List[str]:
        """Extract company names (simplified approach)"""
        # This is a simplified extraction - in production, you'd use more sophisticated methods
        lines = text.split('\n')
        companies = []
        
        for line in lines:
            # Simple heuristic: lines with "Inc", "LLC", "Corp", etc.
            if any(suffix in line for suffix in ['Inc', 'LLC', 'Corp', 'Ltd', 'Company']):
                companies.append(line.strip())
        
        return companies[:5]
    
    def _extract_sections(self, text: str) -> Dict[str, str]:
        """Extract different sections from resume"""
        sections = {}
        
        # Common section headers
        section_patterns = {
            'experience': r'(experience|employment|work history)',
            'education': r'(education|academic)',
            'skills': r'(skills|technical skills|core competencies)',
            'summary': r'(summary|objective|profile)'
        }
        
        current_section = None
        current_content = []
        
        lines = text.split('\n')
        
        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                continue
            
            # Check if this line is a section header
            is_header = False
            for section_name, pattern in section_patterns.items():
                if re.search(pattern, line_stripped, re.IGNORECASE):
                    # Save previous section
                    if current_section and current_content:
                        sections[current_section] = '\n'.join(current_content)
                    
                    current_section = section_name
                    current_content = []
                    is_header = True
                    break
            
            if not is_header and current_section:
                current_content.append(line_stripped)
        
        # Save the last section
        if current_section and current_content:
            sections[current_section] = '\n'.join(current_content)
        
        return sections
    
    async def score_resume(self, resume_text: str, job_description: str, 
                          job_requirements: List[str]) -> ScoreResponse:
        """Score resume against job description"""
        try:
            # Parse resume first
            parse_result = await self.parse_resume(resume_text)
            profile = parse_result.profile
            
            # Calculate individual scores
            skill_overlap = self._calculate_skill_overlap(profile.skills, job_requirements)
            semantic_similarity = self._calculate_semantic_similarity(resume_text, job_description)
            role_relevance = self._calculate_role_relevance(profile.roles, job_description)
            seniority_match = self._calculate_seniority_match(profile.experience_years, job_description)
            
            # Calculate overall score
            weights = {'skill_overlap': 0.3, 'semantic_similarity': 0.25, 
                      'role_relevance': 0.25, 'seniority_match': 0.2}
            
            overall_score = (
                skill_overlap * weights['skill_overlap'] +
                semantic_similarity * weights['semantic_similarity'] +
                role_relevance * weights['role_relevance'] +
                seniority_match * weights['seniority_match']
            ) * 10  # Scale to 0-10
            
            # Generate recommendation
            recommendation = self._get_recommendation(overall_score)
            
            # Calculate confidence (simplified)
            confidence = min(0.95, 0.6 + (overall_score / 20))
            
            # Find missing skills
            missing_skills = [skill for skill in job_requirements 
                            if skill.lower() not in [s.lower() for s in profile.skills]]
            
            # Generate summary
            summary = self._generate_summary(profile, overall_score, job_description)
            
            # Generate interview questions
            interview_questions = await self._generate_interview_questions(profile, job_description)
            
            return ScoreResponse(
                candidate_id=str(uuid.uuid4()),
                overall_score=round(overall_score, 2),
                score_breakdown=ScoreBreakdown(
                    skill_overlap=round(skill_overlap, 3),
                    semantic_similarity=round(semantic_similarity, 3),
                    role_relevance=round(role_relevance, 3),
                    seniority_match=round(seniority_match, 3)
                ),
                extracted_skills=profile.skills,
                missing_skills=missing_skills,
                summary=summary,
                interview_questions=interview_questions,
                recommendation=recommendation,
                confidence=round(confidence, 3)
            )
            
        except Exception as e:
            logger.error(f"Resume scoring failed: {e}")
            raise
    
    def _calculate_skill_overlap(self, resume_skills: List[str], job_requirements: List[str]) -> float:
        """Calculate skill overlap between resume and job requirements"""
        if not job_requirements:
            return 0.8  # Default score if no requirements specified
        
        resume_skills_lower = [skill.lower() for skill in resume_skills]
        job_requirements_lower = [req.lower() for req in job_requirements]
        
        matches = len([req for req in job_requirements_lower if req in resume_skills_lower])
        
        return matches / len(job_requirements) if job_requirements else 0.0
    
    def _calculate_semantic_similarity(self, resume_text: str, job_description: str) -> float:
        """Calculate semantic similarity using TF-IDF"""
        try:
            # Fit TF-IDF on both texts
            texts = [resume_text.lower(), job_description.lower()]
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
            
        except Exception as e:
            logger.warning(f"Semantic similarity calculation failed: {e}")
            return 0.5  # Default similarity
    
    def _calculate_role_relevance(self, resume_roles: List[str], job_description: str) -> float:
        """Calculate relevance of candidate's roles to job description"""
        if not resume_roles:
            return 0.3
        
        job_description_lower = job_description.lower()
        
        # Count relevant roles
        relevant_count = 0
        for role in resume_roles:
            if any(keyword in job_description_lower for keyword in role.lower().split()):
                relevant_count += 1
        
        return min(1.0, relevant_count / len(resume_roles) * 2)
    
    def _calculate_seniority_match(self, experience_years: Optional[int], job_description: str) -> float:
        """Calculate seniority match based on experience years"""
        if experience_years is None:
            return 0.5  # Default if experience not specified
        
        job_description_lower = job_description.lower()
        
        # Determine required seniority level
        if any(keyword in job_description_lower for keyword in ['senior', 'lead', 'principal']):
            required_years = 5
        elif any(keyword in job_description_lower for keyword in ['mid', 'intermediate']):
            required_years = 3
        else:
            required_years = 1  # Junior level
        
        # Calculate match score
        if experience_years >= required_years:
            # Bonus for more experience, but diminishing returns
            excess_years = experience_years - required_years
            bonus = min(0.3, excess_years * 0.05)
            return min(1.0, 0.8 + bonus)
        else:
            # Penalty for less experience
            deficit = required_years - experience_years
            return max(0.0, 0.8 - (deficit * 0.15))
    
    def _get_recommendation(self, overall_score: float) -> RecommendationType:
        """Generate recommendation based on overall score"""
        if overall_score >= 8.0:
            return RecommendationType.STRONG_MATCH
        elif overall_score >= 6.5:
            return RecommendationType.GOOD_MATCH
        elif overall_score >= 5.0:
            return RecommendationType.MODERATE_MATCH
        elif overall_score >= 3.0:
            return RecommendationType.WEAK_MATCH
        else:
            return RecommendationType.NO_MATCH
    
    def _generate_summary(self, profile: ExtractedProfile, score: float, job_description: str) -> str:
        """Generate AI summary of candidate"""
        experience_text = f"{profile.experience_years} years of experience" if profile.experience_years else "experience not specified"
        skills_text = f"with skills in {', '.join(profile.skills[:5])}" if profile.skills else "with various technical skills"
        
        if score >= 8.0:
            return f"Excellent candidate {skills_text} and {experience_text}. Strong alignment with job requirements and demonstrates relevant expertise."
        elif score >= 6.5:
            return f"Good candidate {skills_text} and {experience_text}. Shows solid alignment with most job requirements."
        elif score >= 5.0:
            return f"Moderate candidate {skills_text} and {experience_text}. Meets some job requirements but may need additional evaluation."
        elif score >= 3.0:
            return f"Candidate {skills_text} and {experience_text}. Limited alignment with job requirements."
        else:
            return f"Candidate {skills_text} and {experience_text}. Minimal alignment with current job requirements."
    
    async def _generate_interview_questions(self, profile: ExtractedProfile, job_description: str) -> List[str]:
        """Generate interview questions based on candidate profile"""
        questions = []
        
        # Technical questions based on skills
        if profile.skills:
            primary_skill = profile.skills[0] if profile.skills else "your primary technology"
            questions.append(f"Can you describe your experience with {primary_skill}?")
            
            if len(profile.skills) > 1:
                secondary_skill = profile.skills[1]
                questions.append(f"How have you used {secondary_skill} in your previous projects?")
        
        # Experience-based questions
        if profile.experience_years:
            if profile.experience_years >= 5:
                questions.append("Can you describe a challenging project you led and how you overcame the obstacles?")
            else:
                questions.append("Tell me about a project you're particularly proud of and your role in its success.")
        
        # Role-specific questions
        if profile.roles:
            questions.append(f"How do you see your experience as a {profile.roles[0]} applying to this position?")
        
        # General questions
        questions.extend([
            "What interests you most about this role and our company?",
            "How do you stay updated with the latest technologies in your field?",
            "Describe a time when you had to learn a new technology quickly."
        ])
        
        return questions[:5]  # Return top 5 questions
    
    async def generate_questions(self, candidate_profile: Dict[str, Any], 
                               job_description: str, focus_areas: Optional[List[str]] = None) -> QuestionResponse:
        """Generate interview questions for a candidate"""
        try:
            questions = []
            question_categories = {}
            difficulty_levels = {}
            
            # Technical questions
            if 'skills' in candidate_profile:
                tech_questions = self._generate_technical_questions(candidate_profile['skills'])
                questions.extend(tech_questions)
                question_categories['technical'] = tech_questions
                
                for q in tech_questions:
                    difficulty_levels[q] = 'medium'
            
            # Experience questions
            if 'experience_years' in candidate_profile:
                exp_questions = self._generate_experience_questions(candidate_profile['experience_years'])
                questions.extend(exp_questions)
                question_categories['experience'] = exp_questions
                
                for q in exp_questions:
                    difficulty_levels[q] = 'medium'
            
            # Behavioral questions
            behavioral_questions = self._generate_behavioral_questions()
            questions.extend(behavioral_questions)
            question_categories['behavioral'] = behavioral_questions
            
            for q in behavioral_questions:
                difficulty_levels[q] = 'easy'
            
            # Estimate duration (5 minutes per question)
            estimated_duration = len(questions) * 5
            
            return QuestionResponse(
                questions=questions,
                question_categories=question_categories,
                difficulty_levels=difficulty_levels,
                estimated_duration=estimated_duration
            )
            
        except Exception as e:
            logger.error(f"Question generation failed: {e}")
            raise
    
    def _generate_technical_questions(self, skills: List[str]) -> List[str]:
        """Generate technical questions based on skills"""
        questions = []
        
        for skill in skills[:3]:  # Focus on top 3 skills
            skill_lower = skill.lower()
            
            if 'python' in skill_lower:
                questions.append("Explain the difference between list comprehensions and generator expressions in Python.")
            elif 'javascript' in skill_lower:
                questions.append("What are the differences between var, let, and const in JavaScript?")
            elif 'react' in skill_lower:
                questions.append("How do you handle state management in a large React application?")
            elif 'sql' in skill_lower or 'database' in skill_lower:
                questions.append("Explain the difference between INNER JOIN and LEFT JOIN.")
            elif 'aws' in skill_lower or 'cloud' in skill_lower:
                questions.append("How would you design a scalable architecture on AWS?")
            else:
                questions.append(f"Describe a challenging problem you solved using {skill}.")
        
        return questions
    
    def _generate_experience_questions(self, experience_years: int) -> List[str]:
        """Generate questions based on experience level"""
        questions = []
        
        if experience_years >= 7:
            questions.extend([
                "How do you approach mentoring junior developers?",
                "Describe your experience with system architecture decisions."
            ])
        elif experience_years >= 3:
            questions.extend([
                "Tell me about a time you had to debug a complex issue.",
                "How do you approach code reviews?"
            ])
        else:
            questions.extend([
                "What's the most challenging project you've worked on?",
                "How do you approach learning new technologies?"
            ])
        
        return questions
    
    def _generate_behavioral_questions(self) -> List[str]:
        """Generate behavioral interview questions"""
        return [
            "Tell me about a time when you had to work under a tight deadline.",
            "Describe a situation where you had to collaborate with a difficult team member.",
            "How do you handle constructive criticism?"
        ]
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get health status of the ML service"""
        return {
            "status": "healthy" if self.is_initialized else "initializing",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "models_loaded": self.is_initialized,
            "uptime": time.time() - self.startup_time
        }