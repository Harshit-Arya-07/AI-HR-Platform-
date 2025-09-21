const mongoose = require('mongoose');

const scoreBreakdownSchema = new mongoose.Schema({
  skillOverlap: { type: Number, required: true, min: 0, max: 1 },
  semanticSimilarity: { type: Number, required: true, min: 0, max: 1 },
  roleRelevance: { type: Number, required: true, min: 0, max: 1 },
  seniorityMatch: { type: Number, required: true, min: 0, max: 1 }
}, { _id: false });

const candidateSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  
  // Resume Data
  resumeText: { type: String, required: true },
  resumeFileName: String,
  resumeUploadDate: { type: Date, default: Date.now },
  
  // Extracted Profile Information
  skills: [{ type: String, trim: true }],
  experienceYears: { type: Number, min: 0 },
  education: [{ type: String, trim: true }],
  roles: [{ type: String, trim: true }],
  companies: [{ type: String, trim: true }],
  
  // Job Application
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job',
    required: true 
  },
  
  // ML Scoring Results
  overallScore: { type: Number, required: true, min: 0, max: 10 },
  scoreBreakdown: { type: scoreBreakdownSchema, required: true },
  extractedSkills: [{ type: String, trim: true }],
  missingSkills: [{ type: String, trim: true }],
  aiSummary: { type: String, required: true },
  recommendation: {
    type: String,
    enum: ['STRONG_MATCH', 'GOOD_MATCH', 'MODERATE_MATCH', 'WEAK_MATCH', 'NO_MATCH'],
    required: true
  },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  
  // Interview Questions
  interviewQuestions: [{ type: String }],
  
  // Recruiter Feedback
  recruiterNotes: String,
  status: {
    type: String,
    enum: ['new', 'reviewed', 'shortlisted', 'interviewed', 'rejected', 'hired'],
    default: 'new'
  },
  recruiterRating: { type: Number, min: 1, max: 5 },
  
  // Timestamps and Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Processing Information
  processingTime: Number, // Time taken for ML processing in seconds
  mlServiceVersion: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
candidateSchema.index({ jobId: 1, overallScore: -1 });
candidateSchema.index({ email: 1, jobId: 1 }, { unique: true });
candidateSchema.index({ status: 1 });
candidateSchema.index({ createdAt: -1 });
candidateSchema.index({ skills: 1 });
candidateSchema.index({ recommendation: 1 });

// Virtual for days since application
candidateSchema.virtual('daysSinceApplication').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to update status with timestamp
candidateSchema.methods.updateStatus = function(newStatus, reviewerId = null) {
  this.status = newStatus;
  this.updatedAt = new Date();
  
  if (newStatus === 'reviewed' && !this.reviewedAt) {
    this.reviewedAt = new Date();
    this.reviewedBy = reviewerId;
  }
  
  return this.save();
};

// Static method to get candidates by job with filtering
candidateSchema.statics.findByJobWithFilters = function(jobId, filters = {}) {
  let query = this.find({ jobId });
  
  // Apply filters
  if (filters.status) {
    query = query.where('status').equals(filters.status);
  }
  
  if (filters.minScore) {
    query = query.where('overallScore').gte(filters.minScore);
  }
  
  if (filters.maxScore) {
    query = query.where('overallScore').lte(filters.maxScore);
  }
  
  if (filters.recommendation) {
    query = query.where('recommendation').equals(filters.recommendation);
  }
  
  if (filters.skills && filters.skills.length > 0) {
    query = query.where('skills').in(filters.skills);
  }
  
  // Sort by score descending by default
  const sortBy = filters.sortBy || 'overallScore';
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
  query = query.sort({ [sortBy]: sortOrder });
  
  // Pagination
  if (filters.limit) {
    query = query.limit(parseInt(filters.limit));
  }
  
  if (filters.skip) {
    query = query.skip(parseInt(filters.skip));
  }
  
  return query.populate('jobId', 'title company');
};

// Static method to get analytics data
candidateSchema.statics.getAnalytics = function(jobId = null) {
  const matchStage = jobId ? { jobId: mongoose.Types.ObjectId(jobId) } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCandidates: { $sum: 1 },
        averageScore: { $avg: '$overallScore' },
        statusDistribution: {
          $push: '$status'
        },
        recommendationDistribution: {
          $push: '$recommendation'
        },
        skillsFrequency: {
          $push: '$skills'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalCandidates: 1,
        averageScore: { $round: ['$averageScore', 2] },
        statusCounts: {
          $let: {
            vars: {
              statusArray: '$statusDistribution'
            },
            in: {
              new: { $size: { $filter: { input: '$$statusArray', cond: { $eq: ['$$this', 'new'] } } } },
              reviewed: { $size: { $filter: { input: '$$statusArray', cond: { $eq: ['$$this', 'reviewed'] } } } },
              shortlisted: { $size: { $filter: { input: '$$statusArray', cond: { $eq: ['$$this', 'shortlisted'] } } } },
              interviewed: { $size: { $filter: { input: '$$statusArray', cond: { $eq: ['$$this', 'interviewed'] } } } },
              rejected: { $size: { $filter: { input: '$$statusArray', cond: { $eq: ['$$this', 'rejected'] } } } },
              hired: { $size: { $filter: { input: '$$statusArray', cond: { $eq: ['$$this', 'hired'] } } } }
            }
          }
        },
        recommendationCounts: {
          $let: {
            vars: {
              recArray: '$recommendationDistribution'
            },
            in: {
              strongMatch: { $size: { $filter: { input: '$$recArray', cond: { $eq: ['$$this', 'STRONG_MATCH'] } } } },
              goodMatch: { $size: { $filter: { input: '$$recArray', cond: { $eq: ['$$this', 'GOOD_MATCH'] } } } },
              moderateMatch: { $size: { $filter: { input: '$$recArray', cond: { $eq: ['$$this', 'MODERATE_MATCH'] } } } },
              weakMatch: { $size: { $filter: { input: '$$recArray', cond: { $eq: ['$$this', 'WEAK_MATCH'] } } } },
              noMatch: { $size: { $filter: { input: '$$recArray', cond: { $eq: ['$$this', 'NO_MATCH'] } } } }
            }
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Candidate', candidateSchema);