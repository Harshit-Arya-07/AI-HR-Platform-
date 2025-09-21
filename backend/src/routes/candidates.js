const express = require('express');
const axios = require('axios');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const router = express.Router();

// Get candidates with filters
router.get('/', async (req, res) => {
  try {
    const { jobId, status, minScore, maxScore, limit = 50, skip = 0 } = req.query;
    
    const filters = {
      status,
      minScore: minScore ? parseFloat(minScore) : undefined,
      maxScore: maxScore ? parseFloat(maxScore) : undefined,
      limit: parseInt(limit),
      skip: parseInt(skip)
    };

    const candidates = await Candidate.findByJobWithFilters(jobId, filters);
    const total = await Candidate.countDocuments(jobId ? { jobId } : {});

    res.json({
      candidates,
      pagination: {
        total,
        page: Math.floor(skip / limit) + 1,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates', message: error.message });
  }
});

// Create candidate with resume scoring
router.post('/', async (req, res) => {
  try {
    const { resumeText, jobId, name, email, phone } = req.body;

    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Call ML service for scoring
    const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/score/`, {
      resume_text: resumeText,
      job_description: job.description,
      job_requirements: job.requirements || []
    });

    const scoreResult = mlResponse.data;

    // Create candidate record
    const candidate = new Candidate({
      name: name || scoreResult.extracted_profile?.name,
      email: email || scoreResult.extracted_profile?.email,
      phone: phone || scoreResult.extracted_profile?.phone,
      resumeText,
      jobId,
      overallScore: scoreResult.overall_score,
      scoreBreakdown: {
        skillOverlap: scoreResult.score_breakdown.skill_overlap,
        semanticSimilarity: scoreResult.score_breakdown.semantic_similarity,
        roleRelevance: scoreResult.score_breakdown.role_relevance,
        seniorityMatch: scoreResult.score_breakdown.seniority_match
      },
      extractedSkills: scoreResult.extracted_skills,
      missingSkills: scoreResult.missing_skills,
      aiSummary: scoreResult.summary,
      recommendation: scoreResult.recommendation,
      confidence: scoreResult.confidence,
      interviewQuestions: scoreResult.interview_questions,
      skills: scoreResult.extracted_skills,
      experienceYears: scoreResult.extracted_profile?.experience_years
    });

    await candidate.save();
    await job.updateCandidateCount();

    res.status(201).json({ 
      message: 'Candidate processed successfully',
      candidate 
    });

  } catch (error) {
    if (error.response?.status === 500) {
      return res.status(500).json({ 
        error: 'ML service error', 
        message: 'Resume processing failed' 
      });
    }
    res.status(500).json({ error: 'Failed to process candidate', message: error.message });
  }
});

// Update candidate status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await candidate.updateStatus(status, req.user.id);
    if (notes) {
      candidate.recruiterNotes = notes;
      await candidate.save();
    }

    res.json({ message: 'Candidate status updated', candidate });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update candidate', message: error.message });
  }
});

module.exports = router;