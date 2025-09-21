# AI HR Platform - Demo Script
# This script demonstrates the platform with sample data

param(
    [switch]$ApiOnly
)

Write-Host "🚀 AI HR Platform - Demo" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

$baseUrl = "http://localhost:8000"  # ML Service URL

if (-not $ApiOnly) {
    Write-Host "This demo will:" -ForegroundColor Cyan
    Write-Host "1. Test the ML service with sample resume data" -ForegroundColor White
    Write-Host "2. Show resume parsing capabilities" -ForegroundColor White  
    Write-Host "3. Demonstrate scoring algorithm" -ForegroundColor White
    Write-Host "4. Generate interview questions" -ForegroundColor White
    Write-Host ""
    
    # Check if ML service is running
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/health/" -Method GET -TimeoutSec 5
        Write-Host "✅ ML Service is running!" -ForegroundColor Green
    } catch {
        Write-Host "❌ ML Service not running. Please start it first:" -ForegroundColor Red
        Write-Host ".\run-local.ps1" -ForegroundColor Yellow
        exit 1
    }
}

# Sample resume data
$sampleResume = @"
John Doe
Senior Software Engineer
john.doe@email.com
+1-555-0123

EXPERIENCE
Senior Software Engineer at TechCorp Inc (2018-2023)
• Led a team of 5 developers in building scalable web applications
• Developed microservices using Python, Django, and Docker
• Implemented CI/CD pipelines with Jenkins and AWS
• Managed PostgreSQL databases and optimized complex queries
• Mentored junior developers and conducted code reviews

Software Engineer at StartupXYZ (2015-2018)
• Built RESTful APIs using Python and Flask
• Worked with React.js for frontend development
• Used Git for version control and Agile methodologies
• Implemented automated testing with pytest and Jest

SKILLS
Technical: Python, Django, Flask, JavaScript, React, Docker, AWS, PostgreSQL, Git, Jenkins, Linux, REST APIs
Leadership: Team management, mentoring, project planning, stakeholder communication

EDUCATION
B.S. Computer Science, University of Technology (2015)
Relevant Coursework: Data Structures, Algorithms, Software Engineering, Database Systems

CERTIFICATIONS
• AWS Certified Developer Associate (2020)
• Certified Kubernetes Administrator (2021)
"@

$jobDescription = @"
We are seeking a Senior Python Developer to join our growing engineering team. The ideal candidate will have 5+ years of experience in Python development, strong knowledge of web frameworks like Django or Flask, and experience with cloud platforms (AWS preferred).

Key Responsibilities:
• Design and develop robust backend systems using Python
• Work with Django/Flask frameworks for web development  
• Deploy and maintain applications on AWS infrastructure
• Implement database solutions and optimize performance
• Code review and mentor team members
• Participate in architectural decisions

Requirements:
• 5+ years of experience in Python development
• Strong experience with Django or Flask
• Experience with AWS cloud services
• PostgreSQL or similar database experience
• Experience with Docker and containerization
• Leadership and mentoring experience preferred
• Bachelor's degree in Computer Science or related field

We offer competitive salary, equity, flexible work arrangements, and comprehensive benefits.
"@

$jobRequirements = @("Python", "Django", "AWS", "PostgreSQL", "5+ years experience", "Leadership skills", "Docker", "RESTful APIs")

Write-Host "📄 Sample Resume Preview:" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host ($sampleResume.Substring(0, [Math]::Min(200, $sampleResume.Length)) + "...") -ForegroundColor Gray
Write-Host ""

Write-Host "💼 Job Description Preview:" -ForegroundColor Yellow  
Write-Host "==========================" -ForegroundColor Yellow
Write-Host ($jobDescription.Substring(0, [Math]::Min(200, $jobDescription.Length)) + "...") -ForegroundColor Gray
Write-Host ""

# Demo 1: Resume Parsing
Write-Host "🔍 Demo 1: Resume Parsing" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$parseRequest = @{
    resume_text = $sampleResume
} | ConvertTo-Json

try {
    $parseResponse = Invoke-RestMethod -Uri "$baseUrl/parse/resume" -Method POST -Body $parseRequest -ContentType "application/json"
    
    Write-Host "✅ Successfully parsed resume!" -ForegroundColor Green
    Write-Host "Name: $($parseResponse.profile.name)" -ForegroundColor White
    Write-Host "Email: $($parseResponse.profile.email)" -ForegroundColor White
    Write-Host "Phone: $($parseResponse.profile.phone)" -ForegroundColor White
    Write-Host "Experience: $($parseResponse.profile.experience_years) years" -ForegroundColor White
    Write-Host "Skills: $($parseResponse.profile.skills -join ', ')" -ForegroundColor White
    Write-Host "Processing Time: $([Math]::Round($parseResponse.processing_time, 3))s" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ Resume parsing failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Demo 2: Resume Scoring
Write-Host "🎯 Demo 2: Resume Scoring" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$scoreRequest = @{
    resume_text = $sampleResume
    job_description = $jobDescription  
    job_requirements = $jobRequirements
} | ConvertTo-Json

try {
    $scoreResponse = Invoke-RestMethod -Uri "$baseUrl/score/" -Method POST -Body $scoreRequest -ContentType "application/json"
    
    Write-Host "✅ Resume scored successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 SCORING RESULTS:" -ForegroundColor Yellow
    Write-Host "Overall Score: $($scoreResponse.overall_score)/10" -ForegroundColor $(if($scoreResponse.overall_score -gt 7) {"Green"} elseif($scoreResponse.overall_score -gt 5) {"Yellow"} else {"Red"})
    Write-Host "Recommendation: $($scoreResponse.recommendation)" -ForegroundColor $(if($scoreResponse.recommendation -eq "STRONG_MATCH") {"Green"} elseif($scoreResponse.recommendation -like "*GOOD*") {"Yellow"} else {"Red"})
    Write-Host "Confidence: $([Math]::Round($scoreResponse.confidence * 100, 1))%" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📈 Score Breakdown:" -ForegroundColor Yellow
    Write-Host "• Skill Overlap: $([Math]::Round($scoreResponse.score_breakdown.skill_overlap * 100, 1))%" -ForegroundColor White
    Write-Host "• Semantic Similarity: $([Math]::Round($scoreResponse.score_breakdown.semantic_similarity * 100, 1))%" -ForegroundColor White
    Write-Host "• Role Relevance: $([Math]::Round($scoreResponse.score_breakdown.role_relevance * 100, 1))%" -ForegroundColor White
    Write-Host "• Seniority Match: $([Math]::Round($scoreResponse.score_breakdown.seniority_match * 100, 1))%" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🎯 Skills Analysis:" -ForegroundColor Yellow
    Write-Host "Found Skills: $($scoreResponse.extracted_skills -join ', ')" -ForegroundColor Green
    if ($scoreResponse.missing_skills.Count -gt 0) {
        Write-Host "Missing Skills: $($scoreResponse.missing_skills -join ', ')" -ForegroundColor Red
    } else {
        Write-Host "Missing Skills: None! 🎉" -ForegroundColor Green
    }
    Write-Host ""
    
    Write-Host "📝 AI Summary:" -ForegroundColor Yellow
    Write-Host $scoreResponse.summary -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ Resume scoring failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Demo 3: Interview Questions
Write-Host "❓ Demo 3: Interview Question Generation" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$candidateProfile = @{
    skills = @("Python", "Django", "AWS", "PostgreSQL", "Docker")
    experience_years = 8
    roles = @("Senior Software Engineer", "Software Engineer")
}

$questionsRequest = @{
    candidate_profile = $candidateProfile
    job_description = $jobDescription
    focus_areas = @("technical_skills", "leadership", "problem_solving")
} | ConvertTo-Json

try {
    $questionsResponse = Invoke-RestMethod -Uri "$baseUrl/questions/generate" -Method POST -Body $questionsRequest -ContentType "application/json"
    
    Write-Host "✅ Interview questions generated!" -ForegroundColor Green
    Write-Host "Estimated Duration: $($questionsResponse.estimated_duration) minutes" -ForegroundColor White
    Write-Host ""
    
    Write-Host "💡 Generated Questions:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $questionsResponse.questions.Count; $i++) {
        $question = $questionsResponse.questions[$i]
        $difficulty = $questionsResponse.difficulty_levels[$question]
        $difficultyColor = switch($difficulty) {
            "easy" { "Green" }
            "medium" { "Yellow" }  
            "hard" { "Red" }
            default { "White" }
        }
        Write-Host "$($i + 1). $question" -ForegroundColor White
        Write-Host "   Difficulty: $difficulty" -ForegroundColor $difficultyColor
        Write-Host ""
    }
    
} catch {
    Write-Host "❌ Question generation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Demo 4: API Health Check
Write-Host "🏥 Demo 4: System Health Check" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health/" -Method GET
    
    Write-Host "✅ System Status: $($healthResponse.status)" -ForegroundColor Green
    Write-Host "Models Loaded: $($healthResponse.models_loaded)" -ForegroundColor $(if($healthResponse.models_loaded) {"Green"} else {"Red"})
    Write-Host "Uptime: $([Math]::Round($healthResponse.uptime, 1)) seconds" -ForegroundColor White
    Write-Host "Version: $($healthResponse.version)" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎊 Demo Complete!" -ForegroundColor Green
Write-Host "================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://localhost:3000 to see the web interface" -ForegroundColor Cyan
Write-Host "2. Open http://localhost:8000/docs for API documentation" -ForegroundColor Cyan
Write-Host "3. Try uploading your own resumes and job descriptions" -ForegroundColor Cyan
Write-Host ""
Write-Host "To explore the code:" -ForegroundColor Yellow
Write-Host "1. Open the VS Code workspace: ai-hr-platform.code-workspace" -ForegroundColor Cyan
Write-Host "2. Use Ctrl+Shift+P -> 'Tasks: Run Task' to start/stop services" -ForegroundColor Cyan