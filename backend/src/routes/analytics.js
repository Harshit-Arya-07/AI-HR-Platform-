const express = require('express');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const router = express.Router();

// Get analytics dashboard data
router.get('/', async (req, res) => {
  try {
    const { jobId } = req.query;

    // Get basic analytics
    const analytics = await Candidate.getAnalytics(jobId);
    
    // Get recent candidates
    const recentCandidates = await Candidate.find(jobId ? { jobId } : {})
      .populate('jobId', 'title company')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email overallScore recommendation status createdAt jobId');

    // Get top skills
    const skillsAggregation = await Candidate.aggregate([
      ...(jobId ? [{ $match: { jobId: mongoose.Types.ObjectId(jobId) } }] : []),
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const result = {
      summary: analytics[0] || {
        totalCandidates: 0,
        averageScore: 0,
        statusCounts: {},
        recommendationCounts: {}
      },
      recentCandidates,
      topSkills: skillsAggregation.map(item => ({
        skill: item._id,
        count: item.count
      }))
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
  }
});

module.exports = router;