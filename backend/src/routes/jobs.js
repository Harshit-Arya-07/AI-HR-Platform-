const express = require('express');
const Job = require('../models/Job');
const router = express.Router();

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs', message: error.message });
  }
});

// Create job
router.post('/', async (req, res) => {
  try {
    const job = new Job({ ...req.body, postedBy: req.user.id });
    await job.save();
    res.status(201).json({ message: 'Job created successfully', job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job', message: error.message });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user.id });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ job });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job', message: error.message });
  }
});

module.exports = router;