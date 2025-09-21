# API Examples and Documentation

This document provides comprehensive examples of API requests and responses for the AI HR Platform.

## Table of Contents

1. [Authentication](#authentication)
2. [Resume Scoring (ML Service)](#resume-scoring-ml-service)
3. [Candidate Management](#candidate-management)
4. [Job Management](#job-management)
5. [Analytics](#analytics)
6. [Error Responses](#error-responses)

## Authentication

### Login

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "recruiter@company.com",
  "password": "securepassword"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Jane Smith",
    "email": "recruiter@company.com",
    "role": "recruiter",
    "company": "TechCorp Inc",
    "lastLogin": "2023-09-18T10:30:00.000Z"
  }
}
```

### Register New User

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "recruiter@company.com",
  "password": "securepassword",
  "company": "TechCorp Inc",
  "role": "recruiter"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Jane Smith",
    "email": "recruiter@company.com",
    "role": "recruiter",
    "company": "TechCorp Inc"
  }
}
```

## Resume Scoring (ML Service)

### Score Resume Against Job

**Request:**
```http
POST /score/
Content-Type: application/json

{
  "resume_text": "John Doe\nSenior Software Engineer\njohn.doe@email.com\n+1-555-0123\n\nEXPERIENCE\nSenior Software Engineer at TechCorp (2018-2023)\n• Led a team of 5 developers in building scalable web applications\n• Developed microservices using Python, Django, and Docker\n• Implemented CI/CD pipelines with Jenkins and AWS\n• Managed PostgreSQL databases and optimized queries\n\nSoftware Engineer at StartupXYZ (2015-2018)\n• Built RESTful APIs using Python and Flask\n• Worked with React.js for frontend development\n• Used Git for version control and Agile methodologies\n\nSKILLS\nPython, Django, Flask, JavaScript, React, Docker, AWS, PostgreSQL, Git, Jenkins\n\nEDUCATION\nB.S. Computer Science, University of Technology (2015)",
  
  "job_description": "We are seeking a Senior Python Developer to join our growing engineering team. The ideal candidate will have 5+ years of experience in Python development, strong knowledge of web frameworks like Django or Flask, and experience with cloud platforms (AWS preferred). You will be responsible for architecting and implementing scalable backend systems, mentoring junior developers, and collaborating with cross-functional teams.\n\nKey Responsibilities:\n• Design and develop robust backend systems using Python\n• Work with Django/Flask frameworks for web development\n• Deploy and maintain applications on AWS infrastructure\n• Implement database solutions and optimize performance\n• Code review and mentor team members\n• Participate in architectural decisions\n\nWe offer competitive salary, equity, flexible work arrangements, and comprehensive benefits.",
  
  "job_requirements": [
    "Python",
    "Django",
    "AWS",
    "PostgreSQL",
    "5+ years experience",
    "Leadership skills",
    "RESTful APIs"
  ]
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "candidate_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "overall_score": 8.7,
  "score_breakdown": {
    "skill_overlap": 0.86,
    "semantic_similarity": 0.82,
    "role_relevance": 0.91,
    "seniority_match": 0.87
  },
  "extracted_skills": [
    "Python",
    "Django", 
    "Flask",
    "JavaScript",
    "React",
    "Docker",
    "AWS",
    "PostgreSQL",
    "Git",
    "Jenkins"
  ],
  "missing_skills": [],
  "summary": "Excellent candidate with skills in Python, Django, Docker, AWS and 8 years of experience. Strong alignment with job requirements and demonstrates relevant leadership expertise in team management and system architecture.",
  "interview_questions": [
    "Can you describe your experience with Python web frameworks, particularly Django?",
    "How have you used AWS in your previous projects?",
    "Can you describe a challenging project you led and how you overcame the obstacles?",
    "How do you approach database optimization and what strategies have you used?",
    "What interests you most about this role and our company?"
  ],
  "recommendation": "STRONG_MATCH",
  "confidence": 0.91
}
```

### Parse Resume Only

**Request:**
```http
POST /parse/resume
Content-Type: application/json

{
  "resume_text": "John Doe\nSoftware Engineer\njohn@example.com\n(555) 123-4567\n\nExperience: 5 years of experience in Python development\nSkills: Python, Django, JavaScript, React\nEducation: Bachelor's Degree in Computer Science"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "profile": {
    "name": "John Doe",
    "email": "john@example.com", 
    "phone": "(555) 123-4567",
    "skills": ["Python", "Django", "JavaScript", "React"],
    "experience_years": 5,
    "education": ["Bachelor's Degree in Computer Science"],
    "roles": ["Software Engineer"],
    "companies": []
  },
  "raw_sections": {
    "experience": "5 years of experience in Python development",
    "skills": "Python, Django, JavaScript, React",
    "education": "Bachelor's Degree in Computer Science"
  },
  "processing_time": 0.234
}
```

### Generate Interview Questions

**Request:**
```http
POST /questions/generate
Content-Type: application/json

{
  "candidate_profile": {
    "skills": ["Python", "Django", "AWS", "PostgreSQL"],
    "experience_years": 5,
    "roles": ["Software Engineer", "Backend Developer"]
  },
  "job_description": "Senior Python Developer position requiring Django expertise and AWS knowledge",
  "focus_areas": ["technical_skills", "leadership", "problem_solving"]
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "questions": [
    "Explain the difference between list comprehensions and generator expressions in Python.",
    "How do you handle database migrations in Django applications?",
    "How would you design a scalable architecture on AWS?",
    "Tell me about a time you had to debug a complex issue.",
    "How do you approach mentoring junior developers?",
    "Tell me about a time when you had to work under a tight deadline."
  ],
  "question_categories": {
    "technical": [
      "Explain the difference between list comprehensions and generator expressions in Python.",
      "How do you handle database migrations in Django applications?",
      "How would you design a scalable architecture on AWS?"
    ],
    "experience": [
      "Tell me about a time you had to debug a complex issue.",
      "How do you approach mentoring junior developers?"
    ],
    "behavioral": [
      "Tell me about a time when you had to work under a tight deadline."
    ]
  },
  "difficulty_levels": {
    "Explain the difference between list comprehensions and generator expressions in Python.": "medium",
    "How do you handle database migrations in Django applications?": "medium",
    "How would you design a scalable architecture on AWS?": "medium",
    "Tell me about a time you had to debug a complex issue.": "medium",
    "How do you approach mentoring junior developers?": "medium",
    "Tell me about a time when you had to work under a tight deadline.": "easy"
  },
  "estimated_duration": 30
}
```

## Candidate Management

### Create Candidate (with Resume Processing)

**Request:**
```http
POST /api/candidates
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@email.com",
  "phone": "+1-555-0123",
  "resumeText": "John Doe\nSenior Software Engineer...",
  "jobId": "64f1a2b3c4d5e6f7g8h9i0j2"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "message": "Candidate processed successfully",
  "candidate": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1-555-0123",
    "jobId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "overallScore": 8.7,
    "scoreBreakdown": {
      "skillOverlap": 0.86,
      "semanticSimilarity": 0.82,
      "roleRelevance": 0.91,
      "seniorityMatch": 0.87
    },
    "extractedSkills": ["Python", "Django", "AWS"],
    "missingSkills": [],
    "recommendation": "STRONG_MATCH",
    "confidence": 0.91,
    "status": "new",
    "createdAt": "2023-09-18T10:30:00.000Z"
  }
}
```

### Get Candidates List

**Request:**
```http
GET /api/candidates?jobId=64f1a2b3c4d5e6f7g8h9i0j2&status=new&minScore=7.0&limit=20&skip=0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "candidates": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "name": "John Doe",
      "email": "john.doe@email.com",
      "overallScore": 8.7,
      "recommendation": "STRONG_MATCH",
      "status": "new",
      "createdAt": "2023-09-18T10:30:00.000Z",
      "jobId": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "title": "Senior Python Developer",
        "company": "TechCorp Inc"
      }
    },
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "name": "Jane Smith",
      "email": "jane.smith@email.com",
      "overallScore": 7.8,
      "recommendation": "GOOD_MATCH",
      "status": "new",
      "createdAt": "2023-09-18T09:15:00.000Z",
      "jobId": {
        "id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "title": "Senior Python Developer",
        "company": "TechCorp Inc"
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 3,
    "limit": 20
  }
}
```

### Update Candidate Status

**Request:**
```http
PATCH /api/candidates/64f1a2b3c4d5e6f7g8h9i0j3/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "shortlisted",
  "notes": "Excellent technical background, would like to proceed with technical interview"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Candidate status updated",
  "candidate": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "status": "shortlisted",
    "recruiterNotes": "Excellent technical background, would like to proceed with technical interview",
    "reviewedAt": "2023-09-18T11:45:00.000Z",
    "updatedAt": "2023-09-18T11:45:00.000Z"
  }
}
```

## Job Management

### Create Job Posting

**Request:**
```http
POST /api/jobs
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Senior Python Developer",
  "company": "TechCorp Inc",
  "description": "We are seeking a Senior Python Developer to join our growing engineering team...",
  "requirements": [
    "5+ years Python experience",
    "Django framework expertise",
    "AWS cloud experience",
    "PostgreSQL database skills"
  ],
  "skills": ["Python", "Django", "AWS", "PostgreSQL", "Docker"],
  "location": "San Francisco, CA (Remote OK)",
  "salaryRange": {
    "min": 120000,
    "max": 180000,
    "currency": "USD"
  },
  "employmentType": "full-time",
  "experienceLevel": "senior"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "message": "Job created successfully",
  "job": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "title": "Senior Python Developer",
    "company": "TechCorp Inc",
    "description": "We are seeking a Senior Python Developer...",
    "requirements": [
      "5+ years Python experience",
      "Django framework expertise", 
      "AWS cloud experience",
      "PostgreSQL database skills"
    ],
    "skills": ["Python", "Django", "AWS", "PostgreSQL", "Docker"],
    "location": "San Francisco, CA (Remote OK)",
    "salaryRange": {
      "min": 120000,
      "max": 180000,
      "currency": "USD"
    },
    "employmentType": "full-time",
    "experienceLevel": "senior",
    "status": "draft",
    "candidateCount": 0,
    "createdAt": "2023-09-18T08:00:00.000Z"
  }
}
```

### Get Jobs List

**Request:**
```http
GET /api/jobs
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "jobs": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "title": "Senior Python Developer",
      "company": "TechCorp Inc",
      "location": "San Francisco, CA (Remote OK)",
      "status": "active",
      "candidateCount": 23,
      "createdAt": "2023-09-18T08:00:00.000Z"
    },
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j5",
      "title": "Frontend Developer",
      "company": "TechCorp Inc",
      "location": "New York, NY",
      "status": "active",
      "candidateCount": 18,
      "createdAt": "2023-09-15T14:30:00.000Z"
    }
  ]
}
```

## Analytics

### Get Dashboard Analytics

**Request:**
```http
GET /api/analytics?jobId=64f1a2b3c4d5e6f7g8h9i0j2
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "summary": {
    "totalCandidates": 45,
    "averageScore": 6.8,
    "statusCounts": {
      "new": 15,
      "reviewed": 12,
      "shortlisted": 8,
      "interviewed": 5,
      "rejected": 3,
      "hired": 2
    },
    "recommendationCounts": {
      "strongMatch": 8,
      "goodMatch": 12,
      "moderateMatch": 15,
      "weakMatch": 7,
      "noMatch": 3
    }
  },
  "recentCandidates": [
    {
      "id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "name": "John Doe",
      "email": "john.doe@email.com",
      "overallScore": 8.7,
      "recommendation": "STRONG_MATCH",
      "status": "shortlisted",
      "createdAt": "2023-09-18T10:30:00.000Z"
    }
  ],
  "topSkills": [
    { "skill": "Python", "count": 38 },
    { "skill": "JavaScript", "count": 32 },
    { "skill": "Django", "count": 28 },
    { "skill": "React", "count": 24 },
    { "skill": "AWS", "count": 22 }
  ]
}
```

## Error Responses

### Validation Error

**Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Validation failed",
  "message": "Request validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    },
    {
      "field": "password", 
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

### Authentication Error

**Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "Token is not valid"
}
```

### Resource Not Found

**Response:**
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Not Found",
  "message": "Candidate not found"
}
```

### Server Error

**Response:**
```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Server Error",
  "message": "Internal Server Error",
  "details": {
    "timestamp": "2023-09-18T12:00:00.000Z",
    "requestId": "req-64f1a2b3c4d5e6f7"
  }
}
```

### Rate Limit Error

**Response:**
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

### ML Service Error

**Response:**
```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{
  "error": "Service Unavailable",
  "message": "ML models are still initializing. Please try again in a moment."
}
```

## Usage Notes

1. **Authentication**: Include the JWT token in the `Authorization` header as `Bearer <token>` for all protected endpoints.

2. **Content Type**: Always use `Content-Type: application/json` for POST/PUT/PATCH requests.

3. **Pagination**: Use `limit` and `skip` query parameters for pagination. Default limit is 50.

4. **Filtering**: Most list endpoints support filtering via query parameters.

5. **Rate Limiting**: API is rate-limited to 100 requests per 15-minute window per IP.

6. **Error Handling**: Always check the HTTP status code and handle errors appropriately in your client application.

7. **Data Validation**: All input data is validated. Check the `details` array in validation error responses for specific field errors.

This API documentation provides examples for the core functionality of the AI HR Platform. For additional endpoints or custom integrations, please refer to the interactive API documentation at `/docs` when the service is running.